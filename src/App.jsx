import React, { useState, useRef, useEffect } from 'react';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const holdTimer = useRef(null);
  
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [nomeArquivoStatus, setNomeArquivoStatus] = useState('');

  const [viewMode, setviewMode] = useState('list'); // 'list', 'camera', 'upload_file'

  const [selectedFile, setselectedFile] = useState(null);

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

  const openVault = async () => {
    setIsVaultOpen(true);
    setviewMode('list'); 
  };

  const turnOnCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Erro ao abrir a câmera:", err);
      alert("Não foi possível acessar a câmera.");
    }
  };

  useEffect(() => {
    if (isVaultOpen && viewMode === 'camera') {
      turnOnCamera();
    } else if (isVaultOpen && viewMode !== 'camera') {
      // Se mudar de view, desliga a câmera
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  }, [isVaultOpen, viewMode]);


  const universalUpload = async (fileData, originalName, mimeType) => {
    setCarregando(true);
    try {
      const response = await fetch('http://localhost:5001/upload-seguro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: fileData,  
          filename: originalName, 
          mime_type: mimeType 
        })
      });

      const dados = await response.json();

      if (response.ok) {
        alert(`Sucesso! Arquivo salvo no cofre.`);
        setselectedFile(null);
        setviewMode('list'); 
      } else {
        alert(`Erro no servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o backend na porta 5001.");
    } finally {
      setCarregando(false);
    }
  };


  const capturarEEnviarFoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagemBase64 = canvas.toDataURL('image/jpeg');

    await universalUpload(imagemBase64, `webcam_capture_${Date.now()}.jpg`, 'image/jpeg');
  };


  const handleSelecaoArquivo = (event) => {
    const file = event.target.files[0];
    if (file) {
      setselectedFile(file);
    }
  };

  const uploadDeviceFile = async () => {
    if (!selectedFile) return;

    setCarregando(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileBase64 = reader.result;
      // Envia arquivo local usando payload genérico
      await universalUpload(fileBase64, selectedFile.name, selectedFile.type);
    };
    reader.readAsDataURL(selectedFile);
  };


  const downloadDocument = async (filename) => {
    try {
      const response = await fetch(`http://localhost:5001/baixar-documento/${filename}`);
      const dados = await response.json();

      if (response.ok && dados.download_url) {
        const link = document.createElement('a');
        link.href = dados.download_url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Erro no download: ${dados.erro || 'Falha ao obter URL'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao baixar documento da nuvem.");
    }
  };


  // --- RENDERIZAÇÃO DA TELA ---
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '20px' }}>
      
      {isVaultOpen ? (
        // --- TELA DO COFRE ESFURO ---
        <div style={{ backgroundColor: '#121212', color: 'white', minHeight: '100vh', padding: '20px', borderRadius: '12px' }}>
          <h3>Cofre de Documentos Seguro</h3>
          
          {/* Navegação Interna do Cofre */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
            <button onClick={() => setviewMode('list')} style={{ ...vaultNavButtonStyle, backgroundColor: viewMode === 'list' ? '#333' : '#222' }}>Meus Docs</button>
            <button onClick={() => setviewMode('camera')} style={{ ...vaultNavButtonStyle, backgroundColor: viewMode === 'camera' ? '#333' : '#222' }}>Câmera</button>
            <button onClick={() => setviewMode('upload_file')} style={{ ...vaultNavButtonStyle, backgroundColor: viewMode === 'upload_file' ? '#333' : '#222' }}>Subir Arquivo</button>
          </div>

          {/* VIEW: LISTAGEM (MEUS DOCS) --- AQUI IRÁ A LISTA DA MAGALU */}
          {viewMode === 'list' && (
            <div>
              <p style={{ color: '#aaa' }}>Seus documentos salvos na nuvem.</p>
              {/* Espaço para listar os arquivos com botões downloadDocument() */}
              <div style={{ border: '1px dashed #333', padding: '20px', borderRadius: '8px', color: '#555' }}>
                [ Futura listagem da Magalu Cloud ]
              </div>
            </div>
          )}

          {/* VIEW: CÂMERA --- VISOR (ORIGINAL) */}
          {viewMode === 'camera' && (
            <div>
              <p style={{ color: '#aaa', fontSize: '14px' }}>Posicione o documento em frente à câmera</p>
              <video ref={videoRef} playsInline style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', backgroundColor: '#000', marginBottom: '10px' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <br />
              <button onClick={capturarEEnviarFoto} disabled={carregando} style={{ ...actionButtonStyle, backgroundColor: carregando ? '#555' : '#00e676', color: '#000' }}>
                {carregando ? "Enviando para Nuvem..." : "Capturar Câmera"}
              </button>
            </div>
          )}

          {/* VIEW: UPLOAD DE ARQUIVO LOCAL (NOVA CAPACIDADE) */}
          {viewMode === 'upload_file' && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <p style={{ color: '#aaa' }}>Selecione PDF, DOCX, XLSX ou Imagens</p>
              
              {/* Input de Arquivo Tradicional Estilizado */}
              <label style={customFileInputStyle}>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" 
                  onChange={handleSelecaoArquivo} 
                  style={{ display: 'none' }} 
                />
                Selecionar Arquivo Local
              </label>
              
              {selectedFile && <p style={{ fontSize: '12px', color: '#888' }}>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
              
              <button onClick={uploadDeviceFile} disabled={!selectedFile || carregando} style={{ ...actionButtonStyle, backgroundColor: carregando ? '#555' : (!selectedFile ? '#333' : '#ff9800'), color: '#000' }}>
                {carregando ? "Enviando Arquivo..." : "Enviar Arquivo Selecionado"}
              </button>
            </div>
          )}

        </div>
      ) : (
        // --- TELA DE CAMUFLAGEM (BOLO DE ROLO - IGUAL) ---
        <div>
          <h2>Receita Tradicional de Bolo de Rolo</h2>
          <p>Pressione e segure o bolo por 3 segundos para ver o modo de preparo completo.</p>
          <div 
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            style={{ width: '300px', height: '300px', backgroundColor: '#ff9800', margin: '20px auto', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <p style={{ color: 'white', fontWeight: 'bold' }}>[ Foto do Bolo de Rolo ]<br/>Segure aqui por 3s</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos Compartilhados e Auxiliares
const vaultNavButtonStyle = { padding: '8px 15px', border: '1px solid #333', borderRadius: '15px', color: 'white', cursor: 'pointer', fontSize: '12px' };
const actionButtonStyle = { marginTop: '15px', padding: '12px 25px', border: 'none', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };
const customFileInputStyle = { border: '1px solid #ff9800', padding: '10px 20px', borderRadius: '20px', color: '#ff9800', cursor: 'pointer', fontSize: '13px' };

export default App;