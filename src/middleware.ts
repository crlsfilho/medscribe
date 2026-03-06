import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Dashboard routes (all protected)
    "/dashboard/:path*",
    "/consulta/:path*",
    "/pacientes/:path*",
    "/ai/:path*",
    // Protected API routes (exclude /api/auth, /api/public)
    "/api/patients/:path*",
    "/api/visits/:path*",
    "/api/appointments/:path*",
    "/api/generate-soap/:path*",
    "/api/generate-document/:path*",
    "/api/export-pdf/:path*",
    "/api/transcribe/:path*",
    "/api/upload/:path*",
    "/api/uploads/:path*",
    "/api/analyze-diagnosis/:path*",
    "/api/suggestions/:path*",
    "/api/medical-qa/:path*",
    "/api/active-agent/:path*",
    "/api/signature/:path*",
    "/api/admin/:path*",
    "/api/news/:path*",
    "/api/pubmed/:path*",
  ],
};
