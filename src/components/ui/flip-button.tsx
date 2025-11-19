import { useState } from 'react'

export function FlipButton({ 
  text1, 
  text2,
  onClick,
  isFlipped,
}: {
  text1: string;
  text2: string;
  onClick?: () => void;
  isFlipped?: boolean;
}) {
  const [internalShow, setInternalShow] = useState(false)
  const show = isFlipped !== undefined ? isFlipped : internalShow

  const handleClick = () => {
    if (isFlipped === undefined) {
      setInternalShow(!internalShow)
    }
    onClick?.()
  }

  return (
    <div className="w-full">
      <button
        className={`w-full h-10 cursor-pointer px-3 font-medium shadow-sm border text-sm transition-all duration-200 rounded-md hover:scale-105 active:scale-95 ${
          show 
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        onClick={handleClick}
      >
        {show ? text1 : text2}
      </button>
    </div>
  )
}
