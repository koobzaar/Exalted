import './Skin.css'
import PropTypes from 'prop-types'

function Skin(props): JSX.Element {
  const divStyle = {
    backgroundImage: `url(${props.backgroundImage})`,
    backgroundSize: '120%', // Ajusta a imagem para cobrir toda a div
    backgroundPosition: 'center' // Centraliza a imagem
  }
  console.log('chromas')
  console.log(props.chromas)
  return (
    <>
      <div className="skin-holder" style={divStyle}>
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
  backgroundImage: PropTypes.string.isRequired
}

export default Skin
