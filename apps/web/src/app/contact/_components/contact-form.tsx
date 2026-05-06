"use client";

import { Send } from "lucide-react";
import type { ReactNode } from "react";

import { useContactForm } from "@/app/contact/_hooks/use-contact-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";

interface FieldLabelProps {
  children: ReactNode;
  htmlFor: string;
  required?: boolean;
}

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  fieldId: string;
  label: string;
  required?: boolean;
}

function FieldLabel({ children, htmlFor, required = false }: FieldLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <Label
        className="font-semibold text-foreground text-sm"
        htmlFor={htmlFor}
      >
        {children}
      </Label>
      <span
        className={cn(
          "rounded-md px-2 py-0.5 font-semibold text-[0.6875rem]",
          required
            ? "bg-primary text-primary-foreground"
            : "border border-border text-muted-foreground"
        )}
      >
        {required ? "必須" : "任意"}
      </span>
    </div>
  );
}

function FormField({
  children,
  error,
  fieldId,
  label,
  required = false,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      {children}
      {error ? (
        <p className="text-destructive text-xs" id={`${fieldId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ContactForm() {
  const {
    fieldErrors,
    handleSubmit,
    handleValueChange,
    isSubmitting,
    status,
    statusMessage,
    values,
  } = useContactForm();

  return (
    <form
      className="flex w-full flex-col gap-5 rounded-[1.125rem] border border-border/70 bg-card p-6 sm:gap-6 sm:rounded-3xl sm:p-10"
      noValidate
      onSubmit={handleSubmit}
    >
      {statusMessage ? (
        <Alert
          className={cn(
            "border-border/70",
            status === "success" && "border-primary/40 bg-primary/10"
          )}
          variant={status === "error" ? "destructive" : "default"}
        >
          <AlertTitle>
            {status === "success" ? "送信しました" : "送信できませんでした"}
          </AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FormField
        error={fieldErrors.name}
        fieldId="contact-name"
        label="お名前"
        required
      >
        <Input
          aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          aria-invalid={Boolean(fieldErrors.name)}
          autoComplete="name"
          className="h-12 rounded-xl border-border bg-background px-4 text-base shadow-none"
          disabled={isSubmitting}
          id="contact-name"
          onChange={handleValueChange("name")}
          placeholder="山田 太郎"
          type="text"
          value={values.name}
        />
      </FormField>

      <FormField
        error={fieldErrors.email}
        fieldId="contact-email"
        label="返信用メールアドレス"
      >
        <Input
          aria-describedby={
            fieldErrors.email ? "contact-email-error" : undefined
          }
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
          className="h-12 rounded-xl border-border bg-background px-4 text-base shadow-none"
          disabled={isSubmitting}
          id="contact-email"
          inputMode="email"
          onChange={handleValueChange("email")}
          placeholder="you@example.com"
          type="email"
          value={values.email}
        />
      </FormField>

      <FormField
        error={fieldErrors.content}
        fieldId="contact-content"
        label="お問い合わせ内容"
        required
      >
        <Textarea
          aria-describedby={
            fieldErrors.content ? "contact-content-error" : undefined
          }
          aria-invalid={Boolean(fieldErrors.content)}
          className="min-h-36 resize-none rounded-xl border-border bg-background px-4 py-3 text-base leading-[1.7] shadow-none sm:min-h-44"
          disabled={isSubmitting}
          id="contact-content"
          onChange={handleValueChange("content")}
          placeholder="ご意見・ご要望・不具合のご報告など、どうぞお気軽にお書きください。"
          value={values.content}
        />
      </FormField>

      <Button
        className="h-12 rounded-xl bg-primary font-semibold text-base hover:bg-brand-dark sm:h-14"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <Spinner aria-hidden="true" /> : null}
        <span>{isSubmitting ? "送信中" : "送信する"}</span>
        {isSubmitting ? null : <Send aria-hidden="true" className="size-4" />}
      </Button>

      <p className="text-center text-muted-foreground text-sm leading-[1.7]">
        送信いただいた内容は、お問い合わせへの返信のみに利用いたします。
      </p>
    </form>
  );
}
