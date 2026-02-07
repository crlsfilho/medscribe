import { NextRequest, NextResponse } from "next/server";

const NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json({ error: "Query obrigatória" }, { status: 400 });
    }

    try {
        // 1. ESearch: Find IDs for the query
        // We filter for "Free Full Text" to be more useful, and sort by relevance
        const esearchUrl = `${NCBI_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
            query + " AND free full text[sb]" // Search filter for free text
        )}&retmode=json&retmax=5&sort=relevance`;

        const searchRes = await fetch(esearchUrl);
        const searchData = await searchRes.json();
        const ids = searchData.esearchresult?.idlist || [];

        if (ids.length === 0) {
            return NextResponse.json([]);
        }

        // 2. ESummary: Get details for the found IDs
        const esummaryUrl = `${NCBI_BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(
            ","
        )}&retmode=json`;

        const summaryRes = await fetch(esummaryUrl);
        const summaryData = await summaryRes.json();
        const result = summaryData.result || {};

        // 3. Transform to our format
        // Filter out the 'uids' list from the result object
        const papers = ids.map((id: string) => {
            const doc = result[id];
            if (!doc) return null;

            return {
                id: id,
                title: doc.title,
                authors: doc.authors?.map((a: any) => a.name) || [],
                journal: doc.source,
                year: new Date(doc.pubdate).getFullYear() || "N/A",
                pmid: id,
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                relevance: "high", // Mocked relevance since Pubmed sorts by it
                snippet: "", // ESummary doesn't provide abstract snippets easily without EFetch, kept empty for now
            };
        }).filter(Boolean);

        return NextResponse.json(papers);
    } catch (error) {
        console.error("Erro na API PubMed:", error);
        return NextResponse.json(
            { error: "Erro ao buscar no PubMed" },
            { status: 500 }
        );
    }
}
