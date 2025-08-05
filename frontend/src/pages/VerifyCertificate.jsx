import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import VerifyForm from '../components/certificates/VerifyForm'

const VerifyCertificate = () => {
  const { id } = useParams()
  const location = useLocation()
  const [certificateId, setCertificateId] = useState(null)
  
  useEffect(() => {
    // Check for certificate ID in route parameter
    if (id) {
      setCertificateId(id)
    } 
    // Check for certificate ID in hash fragment (for backward compatibility)
    else if (location.hash) {
      const hashId = location.hash.substring(1) // Remove the # symbol
      if (hashId) {
        setCertificateId(hashId)
      }
    }
  }, [id, location.hash])
  
  return (
    <div className='pt-20 md:pt-16 lg:pt-20 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 2xl:px-64 max-w-screen-2xl mx-auto'>
      <VerifyForm certificateId={certificateId} />
    </div>
  )
}

export default VerifyCertificate
