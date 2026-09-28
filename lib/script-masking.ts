import type { ProcessedPage, ProcessedScript } from "@/types/osm"

export const PROTECTED_PAGE_COUNT = 2

export function getProcessedPages(script: ProcessedScript): ProcessedPage[] {
  return Array.from({ length: Math.max(script.pageCount, 0) }, (_, index) => {
    const pageNumber = index + 1
    return {
      id: `${script.id}-page-${pageNumber}`,
      scriptId: script.id,
      pageNumber,
      sourcePageNumber: script.startPage + index,
      status:
        pageNumber <= PROTECTED_PAGE_COUNT
          ? "protected"
          : "evaluator_visible",
    }
  })
}

export function isPageProtected(pageNumber: number) {
  return pageNumber >= 1 && pageNumber <= PROTECTED_PAGE_COUNT
}

export function getProtectedPages(script: ProcessedScript) {
  return getProcessedPages(script).filter((page) => page.status === "protected")
}

export function getEvaluatorVisiblePages(script: ProcessedScript) {
  return getProcessedPages(script).filter(
    (page) => page.status === "evaluator_visible"
  )
}

export function getFirstEvaluatorPage(script: ProcessedScript) {
  return getEvaluatorVisiblePages(script)[0]
}

export function getLastEvaluatorPage(script: ProcessedScript) {
  const pages = getEvaluatorVisiblePages(script)
  return pages[pages.length - 1]
}

export function clampEvaluatorPage(script: ProcessedScript, pageNumber: number) {
  const visiblePages = getEvaluatorVisiblePages(script)
  if (visiblePages.length === 0) return undefined

  const firstPage = visiblePages[0].pageNumber
  const lastPage = visiblePages[visiblePages.length - 1].pageNumber
  return Math.min(Math.max(Math.trunc(pageNumber), firstPage), lastPage)
}

export function getPageRangeLabel(pages: ProcessedPage[]) {
  if (pages.length === 0) return "None"
  return `${pages[0].pageNumber}-${pages[pages.length - 1].pageNumber}`
}
