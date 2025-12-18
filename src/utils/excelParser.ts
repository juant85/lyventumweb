// src/utils/excelParser.ts
import * as XLSX from 'xlsx';
import { Booth } from '../types';

export interface ParsedExcelData {
    sessions: {
        name: string;
        startTime: string;
        endTime: string;
        timeNeedsReview?: boolean;
        dateNeedsReview?: boolean;
        wasDuplicate?: boolean;
        originalName?: string;
    }[];
    booths: { physicalId: string, companyName: string }[];
    registrations: {
        sessionName: string;
        firstName: string;
        lastName: string;
        attendeeOrganization: string;
        isVendor: boolean;
        expectedBoothPhysicalId: string;
    }[];
    errors: string[];
}

const cleanText = (text: any): string => {
    if (text === null || typeof text === 'undefined') return '';
    // Enhanced cleaning: remove parenthetical notes and standard › character
    return String(text).replace(/\s*\(.*\)\s*/g, ' ').replace(/›/g, '').trim();
};

const isDate = (value: any): value is Date => value instanceof Date && !isNaN(value.getTime());

export const parseEventScheduleExcel = (fileBuffer: ArrayBuffer): ParsedExcelData => {
    const errors: string[] = [];
    const sessions: {
        name: string;
        startTime: Date;
        endTime: Date;
        timeNeedsReview: boolean;
        dateNeedsReview: boolean;
        wasDuplicate?: boolean;
        originalName?: string;
    }[] = [];
    const boothsMap = new Map<string, { companyName?: string }>();
    const registrations: ParsedExcelData['registrations'] = [];
    const sessionNameTracker = new Map<string, { count: number; firstDate: Date }>();
    // Use a Set to track unique registrations and prevent duplicates.
    const uniqueRegistrationKeys = new Set<string>();

    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true, bookVBA: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("Excel file contains no sheets.");
        }

        for (const sheetName of workbook.SheetNames) {
            let baseDate = new Date(sheetName);
            let dateNeedsReview = false;
            if (isNaN(baseDate.getTime())) {
                errors.push(`Sheet name "${sheetName}" is not a valid date. A default date has been assigned. Please review manually.`);
                baseDate = new Date();
                dateNeedsReview = true;
            }

            const ws = workbook.Sheets[sheetName];
            if (!ws) {
                errors.push(`Could not read sheet "${sheetName}".`);
                continue;
            }

            const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

            const boothHeaderRowIndex = jsonData.findIndex(row => row && row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase().startsWith('booth:')));
            if (boothHeaderRowIndex === -1) {
                errors.push(`Sheet "${sheetName}": Could not find a header row containing 'Booth:'. This sheet will be skipped for registration parsing.`);
                continue;
            }

            const boothColumns: { colIndex: number; physicalId: string }[] = [];
            jsonData[boothHeaderRowIndex].forEach((cell, colIndex) => {
                if (typeof cell === 'string' && cell.trim().toLowerCase().startsWith('booth:')) {
                    const physicalId = cell.split(':')[1]?.trim();
                    if (physicalId) boothColumns.push({ colIndex, physicalId });
                }
            });

            if (boothColumns.length === 0) {
                errors.push(`Sheet "${sheetName}": No valid 'Booth: [ID]' headers found. Please check the booth header row.`);
            }

            const sessionRowIndices: number[] = [];
            jsonData.forEach((row, rowIndex) => {
                if (rowIndex > boothHeaderRowIndex && row && (row[0] !== null && String(row[0]).trim() !== '')) {
                    sessionRowIndices.push(rowIndex);
                }
            });

            for (let i = 0; i < sessionRowIndices.length; i++) {
                const startRow = sessionRowIndices[i];
                const endRow = (i + 1 < sessionRowIndices.length) ? sessionRowIndices[i + 1] : jsonData.length;

                const sessionValue = jsonData[startRow][0];

                let sessionName: string;
                let startTime: Date;
                let endTime: Date;
                let timeNeedsReview = false;

                if (sessionValue === null || String(sessionValue).trim() === '') {
                    errors.push(`Sheet "${sheetName}", Row ${startRow + 1}: Empty cell found where a session start was expected.`);
                    continue;
                }

                const setDateTime = (timeSource: Date) => {
                    const finalDate = new Date(baseDate);
                    finalDate.setHours(timeSource.getHours(), timeSource.getMinutes(), timeSource.getSeconds(), timeSource.getMilliseconds());
                    return finalDate;
                };

                if (isDate(sessionValue)) {
                    startTime = setDateTime(sessionValue);
                    endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
                    sessionName = `Session @ ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    timeNeedsReview = false;
                } else if (typeof sessionValue === 'string') {
                    sessionName = cleanText(sessionValue);
                    const timeMatch = sessionName.match(/\b(\d{1,2})[:.](\d{2})\b/);

                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                            const tempTime = new Date();
                            tempTime.setHours(hours, minutes, 0, 0);
                            startTime = setDateTime(tempTime);
                            endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
                            timeNeedsReview = false;
                        } else {
                            errors.push(`Sheet "${sheetName}", Row ${startRow + 1}: Invalid time found in session name "${sessionName}". Using default time.`);
                            startTime = setDateTime(new Date());
                            endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
                            timeNeedsReview = true;
                        }
                    } else {
                        errors.push(`Sheet "${sheetName}", Row ${startRow + 1}: Could not parse time from session name "${sessionName}". A default time has been set. Please review and edit manually.`);
                        startTime = setDateTime(new Date());
                        endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
                        timeNeedsReview = true;
                    }
                } else {
                    errors.push(`Sheet "${sheetName}", Row ${startRow + 1}: Invalid data type in the first column for a session. Got ${typeof sessionValue}.`);
                    continue;
                }

                const originalSessionName = sessionName;
                const tracker = sessionNameTracker.get(originalSessionName.toLowerCase());
                let wasDuplicate = false;
                let originalNameToStore: string | undefined = undefined;

                if (tracker) {
                    wasDuplicate = true;
                    originalNameToStore = originalSessionName;
                    const formattedDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    if (formattedDate(startTime) !== formattedDate(tracker.firstDate)) {
                        sessionName = `${originalSessionName} (${formattedDate(startTime)})`;
                    } else {
                        sessionName = `${originalSessionName} (${tracker.count + 1})`;
                    }
                    errors.push(`Duplicate session name "${originalSessionName}" detected. Renamed to "${sessionName}".`);
                    sessionNameTracker.set(originalSessionName.toLowerCase(), { count: tracker.count + 1, firstDate: tracker.firstDate });
                } else {
                    sessionNameTracker.set(originalSessionName.toLowerCase(), { count: 1, firstDate: startTime });
                }

                sessions.push({
                    name: sessionName,
                    startTime,
                    endTime,
                    timeNeedsReview,
                    dateNeedsReview,
                    wasDuplicate,
                    originalName: originalNameToStore
                });

                for (const boothInfo of boothColumns) {
                    let currentVendor: string | null = null;
                    let currentAttendeeCompany: string | null = null;

                    for (let r = startRow; r < endRow; r++) {
                        const cellValue = jsonData[r]?.[boothInfo.colIndex];
                        if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') continue;

                        const text = String(cellValue).trim();

                        if (text.startsWith('›')) {
                            const companyName = cleanText(text);
                            if (!currentVendor) {
                                currentVendor = companyName;
                                if (!boothsMap.has(boothInfo.physicalId)) {
                                    boothsMap.set(boothInfo.physicalId, { companyName });
                                }
                            }
                            currentAttendeeCompany = companyName;
                        } else {
                            const personName = cleanText(text);
                            const attendeeOrg = currentAttendeeCompany || currentVendor;

                            const nameParts = personName.split(' ').filter(Boolean);
                            const lastName = nameParts.pop() || '';
                            const firstName = nameParts.join(' ');


                            if (attendeeOrg) {
                                const uniqueKey = `${sessionName.toLowerCase()}|${firstName.toLowerCase()}|${lastName.toLowerCase()}|${attendeeOrg.toLowerCase()}`;

                                console.log('🔍 Processing:', personName, '|', firstName, lastName, '| Org:', attendeeOrg, '| Booth:', boothInfo.physicalId, '| isVendor:', currentVendor === attendeeOrg);

                                if (!uniqueRegistrationKeys.has(uniqueKey)) {
                                    uniqueRegistrationKeys.add(uniqueKey);
                                    const newRegistration = {
                                        sessionName,
                                        firstName,
                                        lastName,
                                        attendeeOrganization: attendeeOrg,
                                        isVendor: currentVendor === attendeeOrg,
                                        expectedBoothPhysicalId: boothInfo.physicalId
                                    };
                                    registrations.push(newRegistration);
                                    console.log('✅ Added registration');
                                } else {
                                    console.log('⚠️ Skipped duplicate registration');
                                }
                            } else {
                                errors.push(`Sheet "${sheetName}", Row ${r + 1}, Booth ${boothInfo.physicalId}: Found person '${personName}' without a preceding company ('›' symbol) in this time block.`);
                            }
                        }
                    }
                }
            }
        }

        const finalSessions = sessions.map(s => ({
            name: s.name,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            timeNeedsReview: s.timeNeedsReview,
            dateNeedsReview: s.dateNeedsReview,
            wasDuplicate: s.wasDuplicate,
            originalName: s.originalName
        }));
        const finalBooths = Array.from(boothsMap.entries()).map(([physicalId, data]) => ({ physicalId, companyName: data.companyName || `Location: ${physicalId}` }));

        return { sessions: finalSessions, booths: finalBooths, registrations, errors };
    } catch (e: any) {
        console.error("Error parsing Excel file:", e);
        errors.push(`A critical error occurred during parsing: ${e.message}`);
        return { sessions: [], booths: [], registrations: [], errors };
    }
};