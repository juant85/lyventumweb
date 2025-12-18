import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  titleClassName?: string;
  bodyClassName?: string;
  titleActions?: ReactNode; // New prop for actions in the title bar
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  icon,
  className,
  titleClassName = '',
  bodyClassName = '',
  titleActions, // Destructure new prop
  ...rest
}) => {
  return (
    <div
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-lg transition-all duration-300 ease-in-out ring-1 ring-inset ring-slate-200/50 dark:ring-slate-700/50 hover:ring-[#0076ce]/70 dark:hover:ring-[#00b9d8]/60 hover:shadow-2xl hover:shadow-[#0076ce]/20 dark:hover:shadow-2xl dark:hover:shadow-[#00b9d8]/15 ${className || ''}`}
      {...rest}
    >
      {title && (
        <div className={`px-5 py-4 bg-slate-50/80 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700 ${titleClassName}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {icon && icon}
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-montserrat">{title}</h3>
            </div>
            {titleActions && <div className="flex-shrink-0">{titleActions}</div>}
          </div>
        </div>
      )}
      <div className={`p-6 font-sans ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
