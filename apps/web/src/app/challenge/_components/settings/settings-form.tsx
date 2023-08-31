'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  DialogFooter,
  Textarea,
} from '@repo/ui';
import { DEFAULT_SETTINGS, useEditorSettingsStore } from '@repo/monaco/settings-store';

const formSchema = z.object({
  fontSize: z.string(),
  bindings: z.string(),
  tabSize: z.string(),
  vimConfig: z.string(),
});

export type FormSchema = z.infer<typeof formSchema>;

export function SettingsForm() {
  const { toast } = useToast();

  const { settings, updateSettings } = useEditorSettingsStore();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
  });

  console.log(form.formState.errors);

  function onSubmit(data: FormSchema) {
    updateSettings(data);
    toast({
      title: 'Settings updated!',
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="fontSize"
          render={({ field }) => (
            <FormItem className="mb-3">
              <FormLabel>Font Size</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="13">13px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="15">15px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="17">17px</SelectItem>
                  <SelectItem value="18">18px</SelectItem>
                  <SelectItem value="19">19px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                  <SelectItem value="21">21px</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tabSize"
          render={({ field }) => (
            <FormItem className="mb-3">
              <FormLabel>Tab Size</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tab size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bindings"
          render={({ field }) => (
            <FormItem className="mb-3">
              <FormLabel>Key Bindings</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="vim">Vim</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vimConfig"
          render={({ field: { value, ...field } }) => (
            <FormItem className="mb-3">
              <FormLabel>Vim Config</FormLabel>
              <Textarea
                value={value || DEFAULT_SETTINGS.vimConfig}
                className="resize-none font-mono"
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogPrimitive.Close asChild>
            <Button type="submit">Save</Button>
          </DialogPrimitive.Close>
        </DialogFooter>
      </form>
    </Form>
  );
}
