"use client";

import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import type { ZodError } from "zod";

import {
  type ContactFormInput,
  type ContactFormOutput,
  contactFormSchema,
} from "@/app/contact/_schemas/contact-form-schema";
import { sendContact } from "@/services/contact-service";

type ContactFormFieldName = keyof ContactFormInput;
type ContactFormStatus = "error" | "idle" | "submitting" | "success";

type ContactFormFieldErrors = Partial<Record<ContactFormFieldName, string>>;

interface UseContactFormOptions {
  onSubmitError?: (message: string) => void;
  onSubmitSuccess?: (message: string) => void;
}

const INITIAL_VALUES = {
  content: "",
  email: "",
  name: "",
} as const satisfies ContactFormInput;

const SUCCESS_MESSAGE =
  "お問い合わせを送信しました。内容を確認のうえ、ご連絡いたします。";

const toFieldErrors = (
  error: ZodError<ContactFormOutput>
): ContactFormFieldErrors => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    content: fieldErrors.content?.[0],
    email: fieldErrors.email?.[0],
    name: fieldErrors.name?.[0],
  };
};

export function useContactForm({
  onSubmitError,
  onSubmitSuccess,
}: UseContactFormOptions = {}) {
  const [fieldErrors, setFieldErrors] = useState<ContactFormFieldErrors>({});
  const [status, setStatus] = useState<ContactFormStatus>("idle");
  const [values, setValues] = useState<ContactFormInput>(INITIAL_VALUES);

  const handleValueChange = useCallback(
    (fieldName: ContactFormFieldName) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const nextValue = event.target.value;

        setValues((currentValues) => ({
          ...currentValues,
          [fieldName]: nextValue,
        }));
        setFieldErrors((currentErrors) => ({
          ...currentErrors,
          [fieldName]: undefined,
        }));
      },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const parsedValues = contactFormSchema.safeParse(values);

      if (!parsedValues.success) {
        setFieldErrors(toFieldErrors(parsedValues.error));
        setStatus("idle");
        return;
      }

      setStatus("submitting");
      setFieldErrors({});

      try {
        await sendContact(parsedValues.data);
        setValues(INITIAL_VALUES);
        setStatus("success");
        onSubmitSuccess?.(SUCCESS_MESSAGE);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "お問い合わせの送信に失敗しました。";

        setStatus("error");
        onSubmitError?.(message);
      }
    },
    [onSubmitError, onSubmitSuccess, values]
  );

  return {
    fieldErrors,
    handleSubmit,
    handleValueChange,
    isSubmitting: status === "submitting",
    values,
  };
}
