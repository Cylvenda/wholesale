/**
 * Client-side mirror of the backend unit maths in
 * `backend/apps/stock/services.py`.
 *
 * Stock is stored in whole BASE units. A product unit only says how many base
 * units one of it contains, so every number the user sees for a selected selling
 * unit is derived here with integer arithmetic - never floating point:
 *
 *   base 239, factor 24  ->  9 whole crates, remainder 23  ->  "9 CS + 23 CHP"
 */
import type { ProductUnit } from "@/api/types"

export type Availability = {
    /** Stock on hand in whole base units. */
    baseStock: number
    /** "How many base units are in one of the selected unit." */
    conversionFactor: number
    /** Whole units of the selected unit that can be sold. */
    availableQuantity: number
    /** Base units left over after taking out every whole pack. */
    remainderBaseQuantity: number
}

/** Whole units of the selected pack that fit into the base stock. */
export function availableInSelectedUnit(baseStock: number, conversionFactor: number): number {
    const stock = Math.trunc(Number(baseStock) || 0)
    const factor = Math.trunc(Number(conversionFactor) || 0)
    if (factor <= 0) return 0
    return Math.floor(stock / factor)
}

/** Base units that cannot be sold in the selected pack. */
export function remainderInBaseUnits(baseStock: number, conversionFactor: number): number {
    const stock = Math.trunc(Number(baseStock) || 0)
    const factor = Math.trunc(Number(conversionFactor) || 0)
    if (factor <= 0) return stock
    return stock % factor
}

/** Whole base units consumed by a whole-unit transaction. */
export function toBaseQuantity(quantity: number, conversionFactor: number): number {
    return Math.trunc(quantity) * Math.trunc(conversionFactor)
}

/**
 * Availability for the selected unit, e.g. base 239 with a 24-bottle crate
 * gives 9 whole crates and 23 bottles left over.
 */
export function describeAvailability(
    baseStock: number,
    conversionFactor: number
): Availability {
    const factor = Math.trunc(conversionFactor) || 1
    return {
        baseStock: Math.trunc(Number(baseStock) || 0),
        conversionFactor: factor,
        availableQuantity: availableInSelectedUnit(baseStock, factor),
        remainderBaseQuantity: remainderInBaseUnits(baseStock, factor),
    }
}

/** "1 Crate = 24 CHP" - the conversion of a single unit. */
export function formatUnitConversion(
    productUnit: Pick<ProductUnit, "unit_abbreviation" | "unit_name" | "conversion_factor">,
    baseLabel: string
): string {
    const unitLabel = productUnit.unit_abbreviation || productUnit.unit_name
    return `1 ${unitLabel} = ${productUnit.conversion_factor} ${baseLabel}`
}

/** "2 CS = 48 CHP" - what the entered quantity actually removes from stock. */
export function formatQuantityConversion(
    quantity: number,
    conversionFactor: number,
    unitLabel: string,
    baseLabel: string
): string {
    return `${quantity} ${unitLabel} = ${toBaseQuantity(quantity, conversionFactor)} ${baseLabel}`
}

/** "9 CS + 23 CHP" - stock as the shopkeeper should read it. */
export function formatAvailableInSelectedUnit(
    baseStock: number,
    conversionFactor: number,
    unitLabel: string,
    baseLabel: string
): string {
    const factor = Math.trunc(conversionFactor) || 1
    const { availableQuantity, remainderBaseQuantity } = describeAvailability(
        baseStock,
        conversionFactor
    )

    // The base unit is simply the base stock.
    if (factor <= 1) {
        return `${availableQuantity} ${baseLabel}`
    }

    if (remainderBaseQuantity === 0) {
        return `${availableQuantity} ${unitLabel}`
    }

    // A pack is only sold whole, so the leftover bottles are always shown:
    // 23 bottles read as "0 CS + 23 CHP", never as a partial crate.
    return `${availableQuantity} ${unitLabel} + ${remainderBaseQuantity} ${baseLabel}`
}

/** Stock in whole base units, e.g. "239 CHP". */
export function formatBaseStock(baseStock: number, baseLabel: string): string {
    return `${Math.trunc(Number(baseStock) || 0)} ${baseLabel}`
}

/**
 * Parses a quantity input. Only whole positive numbers exist in this shop, so
 * anything fractional or non-numeric returns null and is rejected before the
 * request is sent.
 */
export function parseWholeQuantity(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) return null
    const text = String(value).trim()
    if (!text || !/^\d+$/.test(text)) return null
    const parsed = Number(text)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}