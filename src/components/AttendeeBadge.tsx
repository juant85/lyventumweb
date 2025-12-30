import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Attendee } from '../types';
import { APP_NAME } from '../constants';
import { UserIcon } from './Icons';
import { useBooths } from '../contexts/booths';
import { useSelectedEvent } from '../contexts/SelectedEventContext';

interface AttendeeBadgeProps {
  attendee: Attendee;
  qrCodeRef?: React.RefObject<HTMLDivElement>;
}

const AttendeeBadge: React.FC<AttendeeBadgeProps> = ({ attendee, qrCodeRef }) => {
  const { booths } = useBooths();
  const { currentEvent } = useSelectedEvent();

  // Get Gold sponsor for badge display
  const goldSponsor = booths.find(b =>
    b.isSponsor && b.sponsorshipTier === 'gold'
  );

  return (
    <div className="bg-white border-2 border-slate-300 dark:border-slate-600 rounded-2xl p-4 sm:p-6 w-full max-w-sm mx-auto font-sans text-center shadow-xl">
      <div className="border-b-2 border-slate-200 dark:border-slate-700 pb-4 mb-4">
        {/* Header with Logo Co-Branding - Stacked Layout */}
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Logos Row */}
          <div className="flex items-center gap-6">
            {/* Company Logo */}
            {currentEvent?.companyLogoUrl && (
              <img
                src={currentEvent.companyLogoUrl}
                alt="Organizer"
                className="h-10 sm:h-12 w-auto object-contain"
                loading="eager"
                draggable="false"
              />
            )}

            {/* Event Logo */}
            {currentEvent?.eventLogoUrl && (
              <img
                src={currentEvent.eventLogoUrl}
                alt="Event"
                className="h-10 sm:h-12 w-auto object-contain"
                loading="eager"
                draggable="false"
              />
            )}
          </div>

          {/* Event Name */}
          <h3 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 font-montserrat mt-1">
            {APP_NAME}
          </h3>
        </div>
      </div>
      <div ref={qrCodeRef} className="my-4 sm:my-6 inline-block p-2 sm:p-3 bg-white border border-slate-200 rounded-lg">
        <QRCodeSVG
          value={attendee.id}
          size={160} // Slightly smaller for mobile safety
          level={"H"}
          includeMargin={false}
        />
      </div>
      <div className="text-left space-y-2">
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
          <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 dark:text-slate-300 mr-3 sm:mr-4 flex-shrink-0" />
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 break-words leading-tight">{attendee.name}</p>
            <p className="text-sm sm:text-md text-slate-600 dark:text-slate-400 break-words leading-tight">{attendee.organization || 'No Organization'}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-2 text-center break-all font-mono">ID: {attendee.id}</p>
      </div>

      {/* Gold Sponsor Logo (NEW) */}
      {goldSponsor && goldSponsor.sponsorLogoUrl && (
        <div className="mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wide">Sponsored by</p>
          <img
            src={goldSponsor.sponsorLogoUrl}
            alt={goldSponsor.companyName}
            className="h-6 sm:h-8 w-auto mx-auto object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default AttendeeBadge;
