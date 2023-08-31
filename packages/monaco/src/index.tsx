'use client';

import clsx from 'clsx';
import { ChevronDown, ChevronUp, Loader2 } from '@repo/ui/icons';
import type * as monaco from 'monaco-editor';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import lzstring from 'lz-string';
import { Button, ToastAction, useToast, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useLocalStorage } from './useLocalStorage';
import SplitEditor, { TESTS_PATH } from './split-editor';
import { createTwoslashInlayProvider } from './twoslash';
import { PrettierFormatProvider } from './prettier';
import { useResetEditor } from './editor-hooks';

const VimStatusBar = dynamic(() => import('./vim-mode'), {
  ssr: false,
});

export interface CodePanelProps {
  challenge: {
    id: number;
    code: string;
    tests: string;
  };
  saveSubmission: (code: string, isSuccessful: boolean) => Promise<void>;
  submissionDisabled: boolean;
  settingsElement: React.ReactNode;
}

export type TsErrors = [
  SemanticDiagnostics: monaco.languages.typescript.Diagnostic[],
  SyntacticDiagnostics: monaco.languages.typescript.Diagnostic[],
  SuggestionDiagnostics: monaco.languages.typescript.Diagnostic[],
  CompilerOptionsDiagnostics: monaco.languages.typescript.Diagnostic[],
];

export function CodePanel(props: CodePanelProps) {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [tsErrors, setTsErrors] = useState<TsErrors>();
  const [isTestPanelExpanded, setIsTestPanelExpanded] = useState(false);
  const [localStorageCode, setLocalStorageCode] = useLocalStorage(
    `challenge-${props.challenge.id}`,
    '',
  );

  const showSubmitSpinner = props.submissionDisabled || tsErrors === undefined;

  const defaultCode =
    lzstring.decompressFromEncodedURIComponent(params.get('code') ?? '') ?? localStorageCode;

  const getDefaultCode = () => {
    if (!defaultCode) {
      return props.challenge.code;
    }

    return defaultCode;
  };

  const [code, setCode] = useState(() => getDefaultCode());
  useResetEditor().subscribe('resetCode', () => {
    setCode(props.challenge.code);
    setLocalStorageCode(props.challenge.code);
  });

  const [testEditorState, setTestEditorState] = useState<monaco.editor.IStandaloneCodeEditor>();
  const [userEditorState, setUserEditorState] = useState<monaco.editor.IStandaloneCodeEditor>();
  const [monacoInstance, setMonacoInstance] = useState<typeof monaco>();

  const handleSubmit = async () => {
    const hasErrors = tsErrors?.some((e) => e.length) ?? false;

    await props.saveSubmission(code ?? '', !hasErrors);
    router.refresh();

    if (hasErrors) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! You still have errors.',
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } else {
      toast({
        variant: 'success',
        title: 'Good job!',
        description: 'You completed this challenge.',
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    }
  };

  return (
    <>
      <div className="sticky top-0 flex h-[40px] items-center justify-end gap-4 border-b border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-[#1e1e1e]">
        {props.settingsElement}
      </div>
      <div className="w-full flex-1">
        <SplitEditor
          monaco={monacoInstance}
          expandTestPanel={isTestPanelExpanded}
          tests={props.challenge.tests}
          userCode={code}
          onMount={{
            tests: (editor) => {
              setTestEditorState(editor);
              setTsErrors([[], [], [], []]);
            },
            user: async (editor, monaco) => {
              setMonacoInstance(monaco);

              monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
                strict: true,
                target: monaco.languages.typescript.ScriptTarget.ESNext,
                strictNullChecks: true,
              });

              monaco.languages.registerDocumentFormattingEditProvider(
                'typescript',
                PrettierFormatProvider,
              );

              setUserEditorState(editor);

              const model = editor.getModel();

              if (!model) {
                throw new Error();
              }

              const ts = await (await monaco.languages.typescript.getTypeScriptWorker())(model.uri);

              monaco.languages.registerInlayHintsProvider(
                'typescript',
                createTwoslashInlayProvider(monaco, ts),
              );
            },
          }}
          onChange={{
            user: async (code) => {
              if (!monacoInstance) return null;
              setCode(code ?? '');
              setLocalStorageCode(code ?? '');
              const getTsWorker = await monacoInstance.languages.typescript.getTypeScriptWorker();

              const mm = monacoInstance.editor.getModel(monacoInstance.Uri.parse(TESTS_PATH));
              if (!mm) return null;

              const tsWorker = await getTsWorker(mm.uri);

              const errors = await Promise.all([
                tsWorker.getSemanticDiagnostics(TESTS_PATH),
                tsWorker.getSyntacticDiagnostics(TESTS_PATH),
                Promise.resolve([]),
                tsWorker.getCompilerOptionsDiagnostics(TESTS_PATH),
              ] as const);

              setTsErrors(errors);
            },
          }}
        />
      </div>
      <div
        className={clsx(
          {
            'justify-between': testEditorState,
          },
          'sticky bottom-0 flex items-center justify-between p-2 dark:bg-[#1e1e1e]',
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsTestPanelExpanded((tp) => !tp);
            }}
          >
            Test
            {isTestPanelExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </Button>
          {userEditorState && <VimStatusBar editor={userEditorState} />}
        </div>
        <div className="flex items-center justify-between gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={showSubmitSpinner}
                size="sm"
                className="cursor-pointer rounded-lg bg-emerald-600 duration-300 hover:bg-emerald-500 dark:bg-emerald-400 dark:hover:bg-emerald-300"
                onClick={handleSubmit}
              >
                {showSubmitSpinner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit{tsErrors === undefined && ' (open test cases)'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Login to Submit</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
