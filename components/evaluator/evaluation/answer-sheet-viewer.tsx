"use client"

import { Button } from "@/components/ui/button"
import {
  clampEvaluatorPage,
  getEvaluatorVisiblePages,
  PROTECTED_PAGE_COUNT,
} from "@/lib/script-masking"
import type { ProcessedScript } from "@/types/osm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  FileImage,
  ImageOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

type AnswerSheetViewerProps = {
  answerSheetId: string
  pageImages: string[]
  processedScript?: ProcessedScript
  initialPage?: number
}

const minimumZoom = 75
const maximumZoom = 150
const zoomStep = 25

function isModeledMissingDemoAsset(source: string) {
  return source.startsWith("/demo/answer-sheets/")
}

export function AnswerSheetViewer({
  answerSheetId,
  pageImages,
  processedScript,
  initialPage,
}: AnswerSheetViewerProps) {
  const visiblePages = processedScript
    ? getEvaluatorVisiblePages(processedScript)
    : []
  const initialMaskedPage =
    processedScript && initialPage !== undefined
      ? clampEvaluatorPage(processedScript, initialPage)
      : visiblePages[0]?.pageNumber
  const [currentPageIndex, setCurrentPageIndex] = useState(() =>
    processedScript && initialMaskedPage !== undefined
      ? Math.max(
          visiblePages.findIndex((page) => page.pageNumber === initialMaskedPage),
          0
        )
      : 0
  )
  const [zoom, setZoom] = useState(100)
  const [failedSources, setFailedSources] = useState<Set<string>>(
    () => new Set()
  )
  const pageCount = processedScript ? visiblePages.length : pageImages.length
  const finalPageIndex = Math.max(pageCount - 1, 0)
  const safePageIndex = Math.min(currentPageIndex, finalPageIndex)
  const currentMaskedPage = processedScript ? visiblePages[safePageIndex] : undefined
  const currentPageSource = processedScript ? undefined : pageImages[safePageIndex]
  const canShowImage = Boolean(
    currentPageSource &&
      !isModeledMissingDemoAsset(currentPageSource) &&
      !failedSources.has(currentPageSource)
  )
  const pageLabel = useMemo(() => {
    if (processedScript) {
      return currentMaskedPage
        ? `Page ${currentMaskedPage.pageNumber} of ${processedScript.pageCount}`
        : "No evaluator-visible pages"
    }

    return pageCount > 0
      ? `Page ${safePageIndex + 1} of ${pageCount}`
      : "No scanned pages"
  }, [currentMaskedPage, pageCount, processedScript, safePageIndex])

  function handleImageError(source: string) {
    setFailedSources((currentSources) => {
      const nextSources = new Set(currentSources)
      nextSources.add(source)
      return nextSources
    })
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              {processedScript ? "Secure Script Viewer" : "Answer Sheet"}
            </CardTitle>
            <CardDescription>
              {processedScript
                ? `Pages 1-${PROTECTED_PAGE_COUNT} are protected from evaluator view.`
                : "Inspect scanned pages without changing saved marks."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Zoom out"
              disabled={zoom <= minimumZoom}
              onClick={() =>
                setZoom((currentZoom) =>
                  Math.max(currentZoom - zoomStep, minimumZoom)
                )
              }
            >
              <ZoomOut className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-14 text-center text-sm tabular-nums">
              {zoom}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Zoom in"
              disabled={zoom >= maximumZoom}
              onClick={() =>
                setZoom((currentZoom) =>
                  Math.min(currentZoom + zoomStep, maximumZoom)
                )
              }
            >
              <ZoomIn className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {processedScript ? (
          <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Script</p>
              <p className="mt-1 font-medium">{processedScript.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total pages</p>
              <p className="mt-1 font-medium">{processedScript.pageCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Protected pages</p>
              <p className="mt-1 font-medium">
                {Math.min(PROTECTED_PAGE_COUNT, processedScript.pageCount) > 0
                  ? `1-${Math.min(PROTECTED_PAGE_COUNT, processedScript.pageCount)}`
                  : "None"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Evaluator pages</p>
              <p className="mt-1 font-medium">
                {visiblePages.length > 0
                  ? `${visiblePages[0].pageNumber}-${visiblePages[visiblePages.length - 1].pageNumber}`
                  : "None"}
              </p>
            </div>
          </div>
        ) : null}
        <div className="flex min-h-[36rem] items-start justify-center overflow-auto rounded-lg border bg-muted/20 p-4">
          {processedScript && currentMaskedPage ? (
            <div
              className="flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center rounded-lg border border-dashed bg-background p-8 text-center shadow-sm"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <FileImage
                className="mb-4 size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-base font-medium">Mock answer script page</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Logical page {currentMaskedPage.pageNumber} is visible to this evaluator.
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {processedScript.id}
              </p>
            </div>
          ) : canShowImage && currentPageSource ? (
            <Image
              src={currentPageSource}
              alt={`${answerSheetId.toUpperCase()} scanned ${pageLabel}`}
              width={900}
              height={1200}
              unoptimized
              className="max-w-full rounded-lg border bg-background shadow-sm"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
              onError={() => handleImageError(currentPageSource)}
            />
          ) : (
            <div
              className="flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center rounded-lg border border-dashed bg-background p-8 text-center shadow-sm"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {pageCount > 0 ? (
                <ImageOff
                  className="mb-4 size-10 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <FileImage
                  className="mb-4 size-10 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <p className="text-base font-medium">
                Demo scanned answer sheet preview
              </p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                {pageCount > 0
                  ? "Sample scan asset is not available for this record."
                  : processedScript
                    ? "This script has no evaluator-visible pages."
                    : "No sample scan asset is attached to this record."}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {answerSheetId}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={safePageIndex <= 0}
            onClick={() =>
              setCurrentPageIndex((pageIndex) => Math.max(pageIndex - 1, 0))
            }
          >
            <ChevronLeft data-icon="inline-start" className="size-4" />
            Previous Page
          </Button>
          <p className="text-center text-sm font-medium tabular-nums">
            {pageLabel}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() =>
              setCurrentPageIndex((pageIndex) =>
                Math.min(pageIndex + 1, Math.max(pageCount - 1, 0))
              )
            }
          >
            Next Page
            <ChevronRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
