import React, { useState } from 'react'
import './Skin.css'
import PropTypes from 'prop-types'

function Skin(props) {
  const [imageLoadError, setImageLoadError] = useState(false)

  const divStyle = {
    backgroundImage: `url(${imageLoadError ? props.backgroundImageAlt : props.backgroundImage})`,
    backgroundSize: '120%',
    backgroundPosition: 'center'
  }

  const handleImageError = () => {
    setImageLoadError(true)
  }

  return (
    <>
      <div className="skin-holder" style={divStyle}>
        {/* Hidden image element to trigger onError */}
        <img
          src={props.backgroundImage}
          alt=""
          style={{ display: 'none' }}
          onError={handleImageError}
        />
        {props.chromas && props.chromas.length > 0 && (
          <div className="chromas">
            {props.chromas.map((chroma) => (
              <div
                key={chroma.chromaId}
                className="chroma-color"
                style={{
                  background: `linear-gradient(135deg, ${chroma.chromaColors[0]} 48%, ${chroma.chromaColors[1]} 48%)`
                }}
              ></div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

Skin.propTypes = {
  chromas: PropTypes.arrayOf(
    PropTypes.shape({
      chromaId: PropTypes.number.isRequired,
      chromaColors: PropTypes.arrayOf(PropTypes.string).isRequired,
      downloadUrl: PropTypes.string.isRequired
    })
  ).isRequired,
  backgroundImage: PropTypes.string.isRequired,
  backgroundImageAlt: PropTypes.string.isRequired
}

export default Skin
