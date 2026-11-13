export declare const HTML_APP_MESSAGE_CEILING: number
export declare const HTML_APP_BYTE_BUDGET: number
export declare const HTML_APP_BYTE_LIMIT: number

export declare function wireBytes(html: string): number

export interface HtmlAppReport {
    ok: boolean
    bytes: number
    wireBytes: number
    embeddedBytes: number
    problems: string[]
    warnings: string[]
export declare const BRAND_BANNER_MESSAGE: string

export declare function richSupported(): boolean
export declare function htmlSupported(): boolean
export declare function buildBrandBanner(customMessage?: string): string
export declare function maybeLogBrandBanner(logger: {
    info: (...args: any[]) => any
} | undefined | null, config?: {
    branding?: boolean | string | {
        enabled?: boolean
        message?: string
    }
    brandBanner?: boolean | string | {
        enabled?: boolean
        message?: string
    }
    brandMessage?: boolean | string | {
        enabled?: boolean
        message?: string
    }
}): boolean
}

export declare function checkHtmlApp(html: string, options?: {
    height?: number
    maxBytes?: number
}): HtmlAppReport
