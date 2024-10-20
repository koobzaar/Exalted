import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './Skin.css'

interface SkinProps {
  backgroundImage: string
  chromas: {
    chromaId: number
    chromaColors: string[]
    downloadUrl: string
  }[]
  skinId: number
  isSelected: boolean
  selectedChromaId: number | null
  onSkinClick: (skinId: number) => void
  onChromaClick: (skinId: number, chromaId: number) => void
}

function Skin({
  backgroundImage,
  chromas,
  skinId,
  isSelected,
  selectedChromaId,
  onSkinClick,
  onChromaClick
}: SkinProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const skinRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const img = new Image()
    img.src = backgroundImage
    img.onload = (): void => {
      setIsLoading(false)
    }
  }, [backgroundImage])

  useEffect(() => {
    if (isSelected && skinRef.current) {
      skinRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isSelected])

  return (
    <motion.div
      ref={skinRef}
      className={`skin-holder ${isLoading ? 'skeleton' : ''}`}
      style={
        !isLoading
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: '120%',
              backgroundPosition: 'center'
            }
          : {}
      }
      whileHover={{
        scale: 1.05,
        backgroundPosition: '60% center',
        transition: { duration: 0.3 }
      }}
      animate={{
        outline: isSelected ? '2px solid #ff0266' : 'none',
        boxShadow: isSelected ? '0 0 10px #ff0266' : 'none',
        transition: { duration: 0.3 } // Adiciona transição suave
      }}
      onClick={() => onSkinClick(skinId)}
    >
      {chromas.length > 0 && !isLoading && (
        <motion.div
          className="chromas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {chromas.map((chroma) => (
            <motion.div
              key={chroma.chromaId}
              className="chroma-color"
              style={{
                background: `linear-gradient(135deg, ${chroma.chromaColors[0]} 48%, ${chroma.chromaColors[1]} 48%)`
              }}
              whileHover={{
                scale: 1.5,
                transition: { duration: 0.2 }
              }}
              animate={{
                outline: selectedChromaId === chroma.chromaId ? '2px solid #ff0266' : 'none',
                boxShadow: selectedChromaId === chroma.chromaId ? '0 0 10px #ff0266' : 'none',
                transition: { duration: 0.3 } // Adiciona transição suave
              }}
              onClick={(e) => {
                e.stopPropagation()
                onChromaClick(skinId, chroma.chromaId)
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

export default Skin
