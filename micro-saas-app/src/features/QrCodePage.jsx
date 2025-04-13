import React from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode.react';

const QrCodePage = () => {
  const { shortUrl } = useParams(); // Getting the short URL from the URL params

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">QR Code for {shortUrl}</h2>
        <QRCode value={shortUrl} size={256} />
      </div>
    </div>
  );
};

export default QrCodePage;
