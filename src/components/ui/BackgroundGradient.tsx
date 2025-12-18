import React from "react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) => {
  return (
    <div className={`relative p-[1px] group ${containerClassName || ''}`}>
      <div
        className={`absolute inset-0 z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500
          bg-[radial-gradient(circle_farthest-side_at_0_100%,#1d4ed8,transparent),radial-gradient(circle_farthest-side_at_100%_0,#16a34a,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#f43f5e,transparent),radial-gradient(circle_farthest-side_at_0_0,#3b82f6,transparent)]
          ${animate ? 'animate-gradient-animation' : ''}
          [background-size:400%_400%] ${containerClassName || ''}`
        }
        style={{ borderRadius: 'inherit' }}
      ></div>
      <div
         className={`absolute inset-0 z-[1]
         bg-[radial-gradient(circle_farthest-side_at_0_100%,#1d4ed8,transparent),radial-gradient(circle_farthest-side_at_100%_0,#16a34a,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#f43f5e,transparent),radial-gradient(circle_farthest-side_at_0_0,#3b82f6,transparent)]
         ${animate ? 'animate-gradient-animation' : ''}
         [background-size:400%_400%] ${containerClassName || ''}`
        }
        style={{ borderRadius: 'inherit' }}
      ></div>

      <div className={`relative z-10 w-full h-full ${className || ''}`}>{children}</div>
    </div>
  );
};

export default BackgroundGradient;
