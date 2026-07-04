import React, { useState, useRef, useEffect } from 'react';

// Cores Extraídas do Figma
const COLORS = {
  bg: '#FAF7F5',       // Creme de fundo
  terracotta: '#C08D7C', // Títulos e Destaques
  sage: '#8C9C84',      // Verde dos ícones/barra
  border: '#D6C8C0',    // Bordas dos cards
  text: '#7A6B63',      // Texto principal
};

function App() {
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [currentPage, setCurrentPage] = useState('camuflagem'); // 'camuflagem' ou 'vault'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'camera'
  
  // --- ESTADOS DE SISTEMA ---
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showRecipes, setShowRecipes] = useState(false);

  // --- REFS ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- LÓGICA DE UPLOAD ---
  const universalUpload = async (fileData, originalName, mimeType) => {
    setCarregando(true);
    setProgresso(10); // Início visual
    
    try {
      // Simulação de progresso para o Pitch
      const interval = setInterval(() => {
        setProgresso(prev => (prev < 90 ? prev + 20 : prev));
      }, 400);

      const response = await fetch('http://localhost:5001/upload-seguro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: fileData, 
          filename: originalName, 
          mime_type: mimeType 
        })
      });

      clearInterval(interval);
      setProgresso(100);

      if (response.ok) {
        setTimeout(() => {
          alert("Documento salvo com sucesso na Magalu Cloud!");
          setShowUploadModal(false);
          setProgresso(0);
        }, 500);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor local.");
    } finally {
      setCarregando(false);
    }
  };

  // Upload de arquivo do dispositivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        universalUpload(reader.result, file.name, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Captura da Câmera
  const capturarFoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg');
    await universalUpload(b64, `foto_${Date.now()}.jpg`, 'image/jpeg');
  };

  // Efeito para ligar câmera quando entrar no modo câmera do modal
  useEffect(() => {
    if (viewMode === 'camera' && showUploadModal) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; });
    }
  }, [viewMode, showUploadModal]);

  // --- TELA 1: CAMUFLAGEM ---
  if (currentPage === 'camuflagem') {
    return (
      <div style={{ ...screenStyle, justifyContent: 'center' }}>
        <h2 style={{ color: COLORS.terracotta, marginBottom: '20px', fontWeight: '400', fontSize: '28px' }}>
          Qual a sua receita hoje?
        </h2>
        
        <div 
          onClick={() => setShowRecipes(!showRecipes)}
          style={{ ...dropdownStyle, borderColor: COLORS.border }}
        >
          <div style={{ border: `1.5px solid ${COLORS.terracotta}`, borderRadius: '50%', width: '15px', height: '15px' }}></div>
          <span style={{ color: COLORS.text, flex: 1, marginLeft: '10px' }}>selecione...</span>
        </div>

        {showRecipes && (
          <div style={recipeListStyle}>
            <div style={recipeItemStyle}>Cheesecake <button onClick={() => alert('Receita simples...')} style={verBtn}>ver receita</button></div>
            <div style={recipeItemStyle}>Bolo de Morango <button onClick={() => alert('Receita simples...')} style={verBtn}>ver receita</button></div>
            {/* O GATILHO SECRETO: OMELETE */}
            <div style={recipeItemStyle}>Omelete de Legumes <button onClick={() => setCurrentPage('vault')} style={verBtn}>ver receita</button></div>
          </div>
        )}
      </div>
    );
  }

  // --- TELA 2: DASHBOARD (VAULT) ---
  return (
    <div style={screenStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '14px', color: COLORS.text }}>Olá, Juliana.</p>
          <h2 style={{ margin: 0, color: COLORS.terracotta, fontSize: '24px' }}>Meus Documentos</h2>
        </div>
        <button onClick={() => setCurrentPage('camuflagem')} style={sairBtn}>SAIR</button>
      </div>

      {/* Barra de Busca e Espaço */}
      <input type="text" placeholder="Buscar arquivos" style={searchStyle} />
      <div style={storageBarStyle}>
        <div style={{ ...storageFillStyle, width: '30%', backgroundColor: COLORS.border }}></div>
      </div>
      <p style={{ fontSize: '10px', textAlign: 'right', color: COLORS.text }}>3/16GB</p>

      {/* Grid de Categorias */}
      <div style={gridStyle}>
        <div style={cardStyle}><span style={iconStyle}>🖼️</span><p>Imagens</p><span>42 Arq.</span></div>
        <div style={cardStyle}><span style={iconStyle}>📄</span><p>PDF</p><span>12 Arq.</span></div>
        <div style={cardStyle}><span style={iconStyle}>📊</span><p>Planilhas</p><span>3 Arq.</span></div>
        <div style={cardStyle}><span style={iconStyle}>📂</span><p>Docs</p><span>20 Arq.</span></div>
      </div>

      {/* Recentes */}
      <h4 style={{ color: COLORS.terracotta, marginTop: '30px' }}>Recentes</h4>
      <div style={fileItemStyle}>📄 Recibo de compra.pdf <span style={{ fontSize: '10px' }}>Ontem</span></div>
      <div style={fileItemStyle}>📝 Contrato advogado.docx <span style={{ fontSize: '10px' }}>2 dias atrás</span></div>

      {/* Botão Flutuante + */}
      <button onClick={() => setShowUploadModal(true)} style={fabStyle}>+</button>

      {/* MODAL DE UPLOAD (TELA 4) */}
      {showUploadModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalDashStyle}>
              {viewMode === 'list' ? (
                <label style={uploadAreaStyle}>
                  <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <div style={{ fontSize: '40px' }}>📁</div>
                  <p>Adicione seu arquivo ou toque para tirar uma foto</p>
                  <button onClick={(e) => { e.preventDefault(); setViewMode('camera'); }} style={cameraToggleBtn}>Usar Câmera</button>
                </label>
              ) : (
                <div style={{ width: '100%' }}>
                  <video ref={videoRef} playsInline style={{ width: '100%', borderRadius: '10px' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <button onClick={capturarFoto} style={actionBtn}>Tirar Foto</button>
                  <button onClick={() => setViewMode('list')} style={{ ...actionBtn, backgroundColor: '#ccc' }}>Voltar</button>
                </div>
              )}

              {/* Barra de Progresso */}
              {progresso > 0 && (
                <div style={{ width: '100%', marginTop: '15px' }}>
                  <div style={{ height: '8px', backgroundColor: '#eee', borderRadius: '4px' }}>
                    <div style={{ height: '100%', width: `${progresso}%`, backgroundColor: COLORS.sage, borderRadius: '4px', transition: '0.3s' }}></div>
                  </div>
                  <p style={{ fontSize: '10px', color: COLORS.sage }}>Enviando... {progresso}%</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowUploadModal(false)} style={cancelBtn}>Cancelar</button>
              <button style={concluirBtn}>Concluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS (FIGMA MATCH) ---
const screenStyle = { backgroundColor: COLORS.bg, minHeight: '100vh', padding: '30px', display: 'flex', flexDirection: 'column' };
const dropdownStyle = { border: '1px solid', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white' };
const recipeListStyle = { marginTop: '10px', border: `1px solid ${COLORS.border}`, borderRadius: '10px', backgroundColor: 'white', overflow: 'hidden' };
const recipeItemStyle = { padding: '15px', borderBottom: `1px solid ${COLORS.bg}`, display: 'flex', justifyContent: 'space-between', color: COLORS.text };
const verBtn = { border: `1px solid ${COLORS.border}`, borderRadius: '5px', padding: '2px 8px', fontSize: '12px', backgroundColor: 'transparent', color: COLORS.text };
const sairBtn = { border: `2px solid ${COLORS.terracotta}`, borderRadius: '10px', padding: '5px 15px', color: COLORS.terracotta, fontWeight: 'bold', backgroundColor: 'transparent' };
const searchStyle = { padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, marginBottom: '15px' };
const storageBarStyle = { height: '10px', backgroundColor: '#eee', borderRadius: '5px', overflow: 'hidden' };
const storageFillStyle = { height: '100%' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' };
const cardStyle = { border: `2px solid ${COLORS.border}`, borderRadius: '15px', padding: '15px', textAlign: 'center', color: COLORS.text };
const iconStyle = { fontSize: '24px', display: 'block', marginBottom: '5px', color: COLORS.sage };
const fileItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.text };
const fabStyle = { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '60px', borderRadius: '30px', backgroundColor: COLORS.border, color: 'white', fontSize: '30px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 };
const modalContent = { backgroundColor: COLORS.bg, padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px' };
const uploadAreaStyle = { border: `2px dashed ${COLORS.terracotta}`, borderRadius: '15px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: COLORS.terracotta, cursor: 'pointer' };
const actionBtn = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sage, color: 'white', marginTop: '10px', fontWeight: 'bold' };
const cancelBtn = { flex: 1, padding: '12px', borderRadius: '10px', border: `2px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.text };
const concluirBtn = { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.border, color: 'white' };
const cameraToggleBtn = { marginTop: '10px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '5px', padding: '5px 10px' };
const modalDashStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '15px', border: `1px solid ${COLORS.border}` };

export default App;