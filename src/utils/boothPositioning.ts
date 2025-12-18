import { Booth, BoothPosition, BoothStatus, BoothLayoutConfig } from '../types';

/**
 * Auto-asigna posición en el mapa basado en physicalId
 * Patrón: L=Left, R=Right, C=Center, A/T=Top
 */
export function assignBoothPosition(booth: Booth): BoothPosition {
    const id = booth.physicalId.toUpperCase().trim();

    // Left Wall (L01, L02, etc.)
    if (id.startsWith('L')) {
        const num = parseInt(id.substring(1)) || 0;
        return { boothId: booth.id, zone: 'left-wall', index: num - 1 };
    }

    // Right Wall (R01, R02, etc.)
    if (id.startsWith('R')) {
        const num = parseInt(id.substring(1)) || 0;
        return { boothId: booth.id, zone: 'right-wall', index: num - 1 };
    }

    // Center (C01-C10 = left, C11-C20 = right)
    if (id.startsWith('C')) {
        const num = parseInt(id.substring(1)) || 0;
        if (num <= 10) {
            return { boothId: booth.id, zone: 'center-left', index: num - 1 };
        } else {
            return { boothId: booth.id, zone: 'center-right', index: num - 11 };
        }
    }

    // Top Wall (A01, A02, T01, etc.)
    if (id.startsWith('A') || id.startsWith('T')) {
        const num = parseInt(id.substring(1)) || 0;
        return { boothId: booth.id, zone: 'top-wall', index: num - 1 };
    }

    // Default: left wall position 0
    console.warn(`Could not auto-position booth ${booth.physicalId}, defaulting to left-wall`);
    return { boothId: booth.id, zone: 'left-wall', index: 0 };
}

/**
 * Determina estado visual del booth
 */
export function getBoothStatus(current: number, expected: number): BoothStatus {
    if (current === 0) return 'empty';
    if (current >= expected) return 'full';
    return 'partial';
}

/**
 * Agrupa booths por zona
 */
export function groupBoothsByZone(
    booths: Array<{ booth: Booth; current: number; expected: number }>,
    customOrder?: Record<string, string[]>
): Record<string, Array<{ booth: Booth; current: number; expected: number; position: BoothPosition }>> {
    const grouped: Record<string, any[]> = {
        'top-wall': [],
        'left-wall': [],
        'center-left': [],
        'center-right': [],
        'right-wall': [],
    };

    // Build a reverse map of boothId -> zone from customOrder
    const boothZoneMap = new Map<string, string>();
    if (customOrder) {
        Object.entries(customOrder).forEach(([zone, ids]) => {
            ids.forEach(id => boothZoneMap.set(id, zone));
        });
    }

    booths.forEach(data => {
        let zone = boothZoneMap.get(data.booth.id);
        let position: BoothPosition;

        if (zone && grouped[zone]) {
            // If found in custom order, use that zone
            position = { boothId: data.booth.id, zone: zone as any, index: 0 }; // index will be fixed by sort
        } else {
            // Fallback to auto-assign
            position = assignBoothPosition(data.booth);
        }

        if (grouped[position.zone]) {
            grouped[position.zone].push({ ...data, position });
        }
    });

    // Sort by custom order or index
    Object.keys(grouped).forEach(zone => {
        if (customOrder && customOrder[zone]) {
            const orderMap = new Map(customOrder[zone].map((id, index) => [id, index]));
            grouped[zone].sort((a, b) => {
                const indexA = orderMap.has(a.booth.id) ? orderMap.get(a.booth.id)! : 9999;
                const indexB = orderMap.has(b.booth.id) ? orderMap.get(b.booth.id)! : 9999;
                return indexA - indexB;
            });
        } else {
            grouped[zone].sort((a, b) => a.position.index - b.position.index);
        }
    });

    return grouped;
}

/**
 * Layout config por defecto
 */
export const DEFAULT_BOOTH_LAYOUT: BoothLayoutConfig = {
    template: 'side-walls-center',
    topWall: 0,
    leftWall: 5,
    centerLeft: 5,
    centerRight: 5,
    rightWall: 5,
};
