import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import React from 'react'
import './Alert.css'

const CustomAlert: React.FC<{ type: string; message: string; onClose: () => void }> = ({
  type,
  message,
  onClose
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    transition={{ duration: 0.3 }}
    className={`custom-alert ${type === 'success' ? 'success' : 'error'}`}
  >
    <div className="custom-alert-content">
      <span>{message}</span>
      <button className="custom-alert-close" onClick={onClose}>
        ×
      </button>
    </div>
  </motion.div>
)

CustomAlert.propTypes = {
  type: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
}

export default CustomAlert
