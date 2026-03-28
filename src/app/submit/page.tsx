"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const schema = z.object({
  admissionNumber: z
    .string()
    .regex(/^CG\/\d{2}\/\d{4}$/, "Must match the format CG/xx/xxxx (e.g. CG/22/0042)"),
  candidateName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  candidateEmail: z
    .string()
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-\(\)]{7,20}$/, "Enter a valid phone number (e.g. +234 801 234 5678)")
    .optional()
    .or(z.literal("")),
  purpose: z.enum(["SCHOOL_ADMISSION", "JOB_APPLICATION", "OTHER"]).refine(
    (v) => v !== undefined,
    { message: "Please select a purpose" }
  ),
  organizationName: z
    .string()
    .min(2, "Organisation name must be at least 2 characters")
    .max(200, "Organisation name is too long"),
  submissionDeadline: z
    .string()
    .refine(
      (v) => !v || new Date(v) >= new Date(new Date().toDateString()),
      "Deadline cannot be in the past"
    )
    .optional(),
  orgFormUrl: z
    .string()
    .url("Must be a valid URL (include https://)")
    .optional()
    .or(z.literal("")),
  additionalInfo: z
    .string()
    .max(2000, "Must be under 2000 characters")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SubmitPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setUploadError(data.error ?? "Upload failed");
    } else {
      setUploadedUrl(data.url);
    }
    setUploading(false);
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        letterFileUrl: uploadedUrl ?? undefined,
        phoneNumber: values.phoneNumber || undefined,
        orgFormUrl: values.orgFormUrl || undefined,
        additionalInfo: values.additionalInfo || undefined,
        submissionDeadline: values.submissionDeadline || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    router.push(`/submit/success?ref=${data.ticketRef}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-sm">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
          Request a Recommendation Letter
        </h1>
        <p className="text-gray-600 dark:text-slate-400 mb-8 text-sm">
          All fields marked with * are required. Your request will be reviewed within
          the team — please allow at least two weeks before your deadline.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Candidate Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Your Information</h2>

            <Field label="CyberGirls Admission Number *" error={errors.admissionNumber?.message}>
              <input
                {...register("admissionNumber")}
                placeholder="e.g. CG/xx/xxxx"
                className={input(errors.admissionNumber)}
              />
            </Field>

            <Field label="Full Name *" error={errors.candidateName?.message}>
              <input
                {...register("candidateName")}
                placeholder="Your full name"
                className={input(errors.candidateName)}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email Address *" error={errors.candidateEmail?.message}>
                <input
                  {...register("candidateEmail")}
                  type="email"
                  placeholder="you@example.com"
                  className={input(errors.candidateEmail)}
                />
              </Field>
              <Field label="Phone Number" error={errors.phoneNumber?.message}>
                <input
                  {...register("phoneNumber")}
                  placeholder="+234 ..."
                  className={input(errors.phoneNumber)}
                />
              </Field>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Request Details</h2>

            <Field label="Purpose *" error={errors.purpose?.message}>
              <select {...register("purpose")} className={input(errors.purpose)}>
                <option value="">Select purpose...</option>
                <option value="SCHOOL_ADMISSION">School / University Admission</option>
                <option value="JOB_APPLICATION">Job Application</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>

            <Field
              label="Organisation / Institution Name *"
              error={errors.organizationName?.message}
            >
              <input
                {...register("organizationName")}
                placeholder="Name of the school, company, or organisation"
                className={input(errors.organizationName)}
              />
            </Field>

            <Field label="Submission Deadline (if applicable)" error={undefined}>
              <input
                {...register("submissionDeadline")}
                type="date"
                className={input(undefined)}
              />
            </Field>

            <Field
              label="Organisation Portal Link (if applicable)"
              error={errors.orgFormUrl?.message}
              hint="Some organisations send their own submission portal URL — paste it here if you have one."
            >
              <input
                {...register("orgFormUrl")}
                type="url"
                placeholder="https://..."
                className={input(errors.orgFormUrl)}
              />
            </Field>

            <Field label="Additional Information" error={undefined}>
              <textarea
                {...register("additionalInfo")}
                rows={3}
                placeholder="Any specific details or highlights you'd like included in the letter..."
                className={input(undefined) + " resize-none"}
              />
            </Field>
          </div>

          {/* File Upload */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Drafted Letter</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Upload your own drafted recommendation letter (.docx only). This is
              strongly recommended to ensure all information is captured correctly.
            </p>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 file:font-medium hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer"
            />
            {uploading && <p className="text-sm text-blue-600 dark:text-blue-400">Uploading...</p>}
            {uploadedUrl && (
              <p className="text-sm text-green-600 dark:text-green-400">✓ File uploaded successfully</p>
            )}
            {uploadError && <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function input(err: any) {
  const base =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400";
  return err
    ? `${base} border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20`
    : `${base} border-gray-300 bg-white dark:border-slate-600`;
}
