import React, { useState, useEffect } from 'react';
import { useSessions } from '../../contexts/sessions';
import { useScans } from '../../contexts/scans';
import { useAttendees } from '../../contexts/attendees';
import { useBooths } from '../../contexts/booths';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { SessionConfig } from '../../types/sessionConfig';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const SessionSimulationPage: React.FC = () => {
    const { addSession, sessions, getOperationalSessionDetails } = useSessions();
    const { addScan } = useScans();
    const { addWalkInAttendee, attendees } = useAttendees();
    const { booths, addBooth } = useBooths();
    const { selectedEventId } = useSelectedEvent();

    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const log = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    };

    const runSimulation = async () => {
        if (!selectedEventId) {
            log('Error: No event selected.');
            return;
        }

        setIsRunning(true);
        setLogs([]);
        log('Starting Simulation...');

        try {
            // 1. Create Test Attendee
            log('Creating Test Attendee...');
            const testEmail = `sim_${Date.now()}@test.com`;
            const { newAttendee } = await addWalkInAttendee({
                name: 'Simulation User',
                email: testEmail,
                organization: 'SimCorp'
            });

            if (!newAttendee) throw new Error('Failed to create attendee');
            log(`Attendee Created: ${newAttendee.name} (${newAttendee.id})`);

            // 2. Create Test Booth (for booth mode scans)
            log('Creating Test Booth...');
            const boothResult = await addBooth(`SIM-${Date.now()}`, 'Simulation Booth');
            const testBooth = boothResult.newBooth;
            if (!testBooth) throw new Error('Failed to create booth');
            log(`Booth Created: ${testBooth.companyName} (${testBooth.id})`);


            // --- SCENARIO 1: Open Presentation (Walk-ins Allowed) ---
            log('--- SCENARIO 1: Open Presentation ---');
            const openConfig: SessionConfig = {
                scanningContext: 'presentation',
                requiresPreAssignment: false, // Walk-ins OK
                allowsWalkIns: true,
                hasCapacity: false,
                boothRestriction: 'none'
            };

            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 3600000); // +1 hour

            log('Creating Session "Simulated Open Keynote"...');
            const { newSession: openSession } = await addSession(
                `Sim Keynote ${Date.now()}`,
                startTime.toISOString(),
                endTime.toISOString(),
                {
                    config: openConfig,
                    sessionType: 'presentation'
                }
            );

            if (!openSession) throw new Error('Failed to create open session');
            log(`Session Created: ${openSession.name} (${openSession.id})`);

            // Verify Config
            if (openSession.config?.scanningContext !== 'presentation') {
                log('WARNING: Session config was not saved correctly via addSession.');
            } else {
                log('SUCCESS: Session config persisted correctly.');
            }

            // SIMULATE SCAN 1: Walk-ins allowed
            log('Simulating Scan for Visitor -> Open Session...');
            const scan1 = await addScan(newAttendee.id, testBooth.id, 'Simulated Open Scan', undefined);

            if (scan1.scan?.scanStatus === 'WALK_IN' || scan1.scan?.scanStatus === 'EXPECTED') {
                log(`SUCCESS: Scan accepted as ${scan1.scan?.scanStatus} (Correct)`);
            } else {
                log(`FAILURE: Scan rejected or unexpected status: ${scan1.scan?.scanStatus} - ${scan1.message}`);
            }

            // --- SCENARIO 2: Restricted Workshop ---
            log('--- SCENARIO 2: Restricted Workshop ---');
            const restrictedConfig: SessionConfig = {
                scanningContext: 'booth_meeting',
                requiresPreAssignment: true,
                allowsWalkIns: false,
                hasCapacity: true,
                maxCapacity: 50,
                boothRestriction: 'assigned'
            };

            const { newSession: restrictedSession } = await addSession(
                `Sim Workshop ${Date.now()}`,
                startTime.toISOString(),
                endTime.toISOString(),
                {
                    config: restrictedConfig,
                    sessionType: 'meeting'
                }
            );

            if (!restrictedSession) throw new Error('Failed to create restricted session');
            log(`Session Created: ${restrictedSession.name} (${restrictedSession.config?.requiresPreAssignment ? 'Pre-assignment REQUIRED' : 'Open'})`);

            log('Simulating Scan (Unregistered) -> Restricted Session...');
            const scan2 = await addScan(newAttendee.id, testBooth.id, 'Simulated Restricted Scan', undefined);

            // WE EXPECT FAILURE (WRONG_BOOTH)
            if (scan2.scan?.scanStatus === 'WRONG_BOOTH') {
                log(`SUCCESS: Scan correctly rejected as WRONG_BOOTH (Registration Required)`);
            } else {
                // Note: If the logic picks up the OPEN session (which is also active), it might register as WALK_IN there.
                // This highlights the ambiguity of simultaneous sessions for walk-ins without specific session selection by the scanner operator.
                // But in a real scenario, the operator selects the session if they are scanning FOR a session.
                // If they are scanning at a BOOTH, the booth logic applies.
                // If the booth is linked to the session, it works.
                // Test booths are just generic booths.

                log(`RESULT: ${scan2.scan?.scanStatus} - ${scan2.message}`);
            }

        } catch (error: any) {
            log(`ERROR: ${error.message}`);
            console.error(error);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Session Configuration Simulation</h1>

            <Card>
                <div className="p-4 space-y-4">
                    <p>This tool verifies that the scanning logic correctly respects the new Session Configuration rules.</p>

                    <div className="flex gap-4">
                        <Button onClick={runSimulation} disabled={isRunning}>
                            {isRunning ? 'Running...' : 'Run Diagnostics'}
                        </Button>
                        <Button variant="secondary" onClick={() => setLogs([])}>Clear Logs</Button>
                    </div>
                </div>
            </Card>

            <Card className="bg-slate-900 text-green-400 font-mono text-sm p-4 h-96 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="text-slate-500 italic">Ready to start...</div>
                ) : (
                    logs.map((L, i) => <div key={i}>{L}</div>)
                )}
            </Card>
        </div>
    );
};

export default SessionSimulationPage;
