import React, { useState, useRef } from 'react';


export default function GuardiaApp() {
 const [isVaultOpen, setIsVaultOpen] = useState(false);
 const [status, setStatus] = useState('');
  const videoRef = useRef(null);
 const canvasRef = useRef(null);
 const holdTimer = useRef(null);


 const handlePointerDown = () => {
   holdTimer.current = setTimeout(() => {
     openVault();
   }, 3000);
 };


 const handlePointerUp = () => {
   if (holdTimer.current) {
     clearTimeout(holdTimer.current);
   }
 };


=  const openVault = async () => {
   setIsVaultOpen(true);
   try {
     const stream = await navigator.mediaDevices.getUserMedia({
       video: { facingMode: 'environment' }
     });
     if (videoRef.current) {
       videoRef.current.srcObject = stream;
     }
   } catch (err) {
     alert("Erro ao acessar a câmera segura.");
   }
 };


 const handleCapture = async () => {
   setStatus("Criptografando e enviando para a Nuvem...");
  
   const canvas = canvasRef.current;
   const video = videoRef.current;
  
   canvas.width = video.videoWidth;
   canvas.height = video.videoHeight;
   const ctx = canvas.getContext('2d');
   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
   const base64Image = canvas.toDataURL('image/jpeg', 0.8);


   try {
     const res = await fetch('http://127.0.0.1:5000/upload-seguro', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ image: base64Image })
     });
    
     if (res.ok) {
       alert("Documento salvo em segurança!");
       handlePanic();
     }
   } catch (err) {
     setStatus("Erro na conexão segura.");
   }
 };


 const handlePanic = () => {
   if (videoRef.current && videoRef.current.srcObject) {
     const tracks = videoRef.current.srcObject.getTracks();
     tracks.forEach(track => track.stop());
   }
   setIsVaultOpen(false);
   setStatus('');
 };


 return (
   <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
    
     {!isVaultOpen ? (
       <div style={{ padding: '20px', backgroundColor: '#fff3e0', height: '100vh' }}>
         <h1 style={{ color: '#d84315' }}>Sabores do Agreste</h1>
         <h2>Bolo de Rolo Tradicional</h2>
         <p>Receita passada de geração em geração. Segure a foto para ver os segredos da massa...</p>
        
         <img
           src="https://via.placeholder.com/400x250?text=Foto+do+Bolo"
           alt="Bolo de Rolo"
           onPointerDown={handlePointerDown}
           onPointerUp={handlePointerUp}
           onPointerLeave={handlePointerUp}
           style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
         />
       </div>
     ) : (
       <div style={{ padding: '20px', backgroundColor: '#121212', color: '#ffffff', height: '100vh' }}>
         <h2>Respaldo</h2>
         <p style={{ color: '#aaa', fontSize: '14px' }}>Nenhuma foto será salva no seu celular.</p>
        
         <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }}></video>
        
         <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        
         <p style={{ color: '#4caf50', fontWeight: 'bold' }}>{status}</p>
        
         <button
           onClick={handleCapture}
           style={{ padding: '15px', width: '100%', fontSize: '16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', marginBottom: '15px' }}>
           📸 Capturar Documento
         </button>
        
         <button
           onClick={handlePanic}
           style={{ padding: '15px', width: '100%', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px' }}>
           🚨 PÂNICO (SAIR AGORA)
         </button>
       </div>
     )}


   </div>
 );
}

