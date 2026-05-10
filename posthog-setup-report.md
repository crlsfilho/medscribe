<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was already initialized via `src/components/providers.tsx` and `src/lib/posthog-server.ts`. This session supplemented that setup by adding 7 new event tracking calls across 4 files, adding exception capture where it was missing, and updating environment variable values to the correct project token and host.

## Events added this session

| Event | Description | File |
|---|---|---|
| `visit_deleted` | Doctor deletes a visit from the dashboard | `src/app/(dashboard)/dashboard/page.tsx` |
| `soap_regenerated` | Doctor regenerates the SOAP note from an updated transcript | `src/app/(dashboard)/consulta/[id]/page.tsx` |
| `document_modal_opened` | Doctor opens the document emission modal | `src/app/(dashboard)/consulta/[id]/page.tsx` |
| `normalization_suggestion_accepted` | Doctor accepts a CID-10 or DCB normalization suggestion | `src/app/(dashboard)/consulta/[id]/page.tsx` |
| `normalization_suggestion_rejected` | Doctor rejects a CID-10 or DCB normalization suggestion | `src/app/(dashboard)/consulta/[id]/page.tsx` |
| `onboarding_skipped` | User clicks "Pular" to skip the full onboarding flow | `src/components/onboarding-flow.tsx` |
| `ai_brainstorm_queried` | Doctor submits a query in the AI clinical brainstorm tool | `src/components/ai-brainstorm.tsx` |

## Previously instrumented events

| Event | File |
|---|---|
| `user_logged_in` | `src/app/(auth)/login/page.tsx` |
| `login_failed` | `src/app/(auth)/login/page.tsx` |
| `user_registered` | `src/app/(auth)/register/page.tsx` |
| `user_registered_server` | `src/app/api/auth/register/route.ts` |
| `onboarding_completed` | `src/components/onboarding-flow.tsx` |
| `visit_started` | `src/app/(dashboard)/consulta/nova/page.tsx` |
| `recording_completed` | `src/app/(dashboard)/consulta/nova/page.tsx` |
| `visit_saved` | `src/app/(dashboard)/consulta/[id]/page.tsx` |
| `soap_exported_pdf` | `src/app/(dashboard)/consulta/[id]/page.tsx` |
| `soap_generated` | `src/app/api/generate-soap/route.ts` |
| `document_generated` | `src/app/api/generate-document/route.ts` |
| `document_signed` | `src/app/api/signature/sign-document/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1565345)
- [Registration → Onboarding Completion Funnel](/insights/eRMNpOtr) — conversion rate from signup to profile completion
- [Clinical Workflow: Visit Started → SOAP Generated](/insights/CS5Alz1b) — measures AI transcription pipeline success rate
- [Document Generation by Type](/insights/zic3zthv) — which document types (prescription, exam, certificate) are most used
- [AI Brainstorm Usage by Mode](/insights/gXHeGjYB) — tracks pharma, protocols, and differential usage patterns
- [New Registrations & Onboarding Skips](/insights/vB9sHpfw) — registrations vs. onboarding skip rate as a churn signal

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
