import React, { useState, useRef, useEffect } from 'react';

const COLORS = {
  bg: '#FAF7F5',       // Creme de fundo
  terracotta: '#C08D7C', // Títulos e Destakes
  sage: '#8C9C84',      // Verde dos ícones/barra
  border: '#D6C8C0',    // Bordas dos cards
  text: '#7A6B63',      // Texto principal
  inputBg: '#FFFFFF'    // Fundo do input
};

function App() {
  const [currentPage, setCurrentPage] = useState('camuflagem'); 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); 
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [showRecipes, setShowRecipes] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Endpoint Dinâmico: Se estiver na Vercel, tenta usar o backend do Railway, senão usa localhost
  const BACKEND_URL = "http://localhost:5001"; // Mude para o link do Railway quando o deploy lá der certo!

  const universalUpload = async (fileData, originalName, mimeType) => {
    setCarregando(true);
    setProgresso(10);
    try {
      const interval = setInterval(() => {
        setProgresso(prev => (prev < 90 ? prev + 20 : prev));
      }, 400);

      const response = await fetch(`${BACKEND_URL}/upload-seguro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: fileData, filename: originalName, mime_type: mimeType })
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
      alert("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => universalUpload(reader.result, file.name, file.type);
      reader.readAsDataURL(file);
    }
  };

  const capturarFoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg');
    await universalUpload(b64, `foto_${Date.now()}.jpg`, 'image/jpeg');
  };

  useEffect(() => {
    if (viewMode === 'camera' && showUploadModal) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; });
    }
  }, [viewMode, showUploadModal]);

  return (
    // WRAPPER DE RESPONSIVIDADE: Centraliza no desktop e ocupa 100% no celular
    <div style={responsiveWrapperStyle}>
      <div style={appContainerStyle}>
        
        {/* --- TELA 1: CAMUFLAGEM --- */}
        {currentPage === 'camuflagem' ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <h2 style={{ color: COLORS.terracotta, marginBottom: '20px', fontWeight: '400', fontSize: '26px', textAlign: 'center' }}>
              Qual a sua receita hoje?
            </h2>
            
            <div onClick={() => setShowRecipes(!showRecipes)} style={{ ...dropdownStyle, borderColor: COLORS.border }}>
              <div style={{ border: `1.5px solid ${COLORS.terracotta}`, borderRadius: '50%', width: '15px', height: '15px' }}></div>
              <span style={{ color: COLORS.text, flex: 1, marginLeft: '10px', textAlign: 'left' }}>selecione...</span>
            </div>

            {showRecipes && (
              <div style={recipeListStyle}>
                <div style={recipeItemStyle}>Cheesecake <button onClick={() => alert('Ingredientes: Queijo, morango...')} style={verBtn}>ver receita</button></div>
                <div style={recipeItemStyle}>Bolo de Morango <button onClick={() => alert('Ingredientes: Trigo, leite...')} style={verBtn}>ver receita</button></div>
                <div style={recipeItemStyle}>Omelete de Legumes <button onClick={() => setCurrentPage('vault')} style={verBtnSecret}>ver receita</button></div>
              </div>
            )}
          </div>
        ) : (
          
          /* --- TELA 2: DASHBOARD (VAULT) --- */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.text }}>Olá, Juliana.</p>
                <h2 style={{ margin: 0, color: COLORS.terracotta, fontSize: '22px', fontWeight: '600' }}>Meus Documentos</h2>
              </div>
              <button onClick={() => setCurrentPage('camuflagem')} style={sairBtn}>SAIR</button>
            </div>

            {/* ABA BUSCAR ARQUIVOS TOTALMENTE ACESSÍVEL E NA PALETA */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Buscar arquivos..." 
                style={searchStyle} 
              />
              <span style={{ position: 'absolute', right: '15px', top: '12px', color: COLORS.terracotta, cursor: 'pointer' }}>🔍</span>
            </div>

            <div style={storageBarStyle}>
              <div style={{ ...storageFillStyle, width: '25%', backgroundColor: COLORS.sage }}></div>
            </div>
            <p style={{ fontSize: '11px', textAlign: 'right', color: COLORS.text, marginTop: '4px' }}>4GB de 16GB usados</p>

            <div style={gridStyle}>
              <div style={cardStyle}><span style={iconStyle}>🖼️</span><p style={cardTitleStyle}>Imagens</p><span style={cardCountStyle}>42 Arq.</span></div>
              <div style={cardStyle}><span style={iconStyle}>📄</span><p style={cardTitleStyle}>PDF</p><span style={cardCountStyle}>12 Arq.</span></div>
              <div style={cardStyle}><span style={iconStyle}>📊</span><p style={cardTitleStyle}>Planilhas</p><span style={cardCountStyle}>3 Arq.</span></div>
              <div style={cardStyle}><span style={iconStyle}>📂</span><p style={cardTitleStyle}>Docs</p><span style={cardCountStyle}>20 Arq.</span></div>
            </div>

            <h4 style={{ color: COLORS.terracotta, marginTop: '25px', textAlign: 'left', marginBottom: '10px' }}>Recentes</h4>
            <div style={fileItemStyle}>📄 Recibo de compra.pdf <span style={{ fontSize: '11px', color: '#aaa' }}>Ontem</span></div>
            <div style={fileItemStyle}>📝 Contrato advogado.docx <span style={{ fontSize: '11px', color: '#aaa' }}>2 dias atrás</span></div>

            <button onClick={() => setShowUploadModal(true)} style={fabStyle}>+</button>

            {/* --- MODAL DE UPLOAD --- */}
            {showUploadModal && (
              <div style={modalOverlay}>
                <div style={modalContent}>
                  <div style={modalDashStyle}>
                    {viewMode === 'list' ? (
                      <label style={uploadAreaStyle}>
                        <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Adicione seu arquivo ou tire uma foto</p>
                        <button onClick={(e) => { e.preventDefault(); setViewMode('camera'); }} style={cameraToggleBtn}>Usar Câmera</button>
                      </label>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <video ref={videoRef} playsInline style={{ width: '100%', borderRadius: '10px', backgroundColor: '#000' }} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <button onClick={capturarFoto} style={actionBtn}>Tirar Foto</button>
                        <button onClick={() => setViewMode('list')} style={{ ...actionBtn, backgroundColor: '#ccc', color: '#333' }}>Voltar</button>
                      </div>
                    )}

                    {progresso > 0 && (
                      <div style={{ width: '100%', marginTop: '15px' }}>
                        <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progresso}%`, backgroundColor: COLORS.sage, transition: '0.3s' }}></div>
                        </div>
                        <p style={{ fontSize: '11px', color: COLORS.sage, margin: '5px 0 0 0' }}>Enviando... {progresso}%</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => setShowUploadModal(false)} style={cancelBtn}>Cancelar</button>
                    <button onClick={() => setShowUploadModal(false)} style={concluirBtn}>Concluir</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS DE RESPONSIVIDADE & LAYOUT ---
const responsiveWrapperStyle = { backgroundColor: '#EFEAE6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' };
const appContainerStyle = { backgroundColor: COLORS.bg, width: '100%', maxWidth: '420px', height: '92vh', maxHeight: '850px', borderRadius: '24px', padding: '30px', boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative' };

// --- ELEMENTOS DO DESIGN ---
const dropdownStyle = { border: '1px solid', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white' };
const recipeListStyle = { marginTop: '8px', border: `1px solid ${COLORS.border}`, borderRadius: '12px', backgroundColor: 'white', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' };
const recipeItemStyle = { padding: '14px', borderBottom: `1px solid ${COLORS.bg}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: COLORS.text, fontSize: '14px' };
const verBtn = { border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', backgroundColor: 'transparent', color: COLORS.text, cursor: 'pointer' };
const verBtnSecret = { ...verBtn, borderColor: COLORS.terracotta, color: COLORS.terracotta, fontWeight: 'bold' };
const sairBtn = { border: `1.5px solid ${COLORS.terracotta}`, borderRadius: '8px', padding: '6px 14px', color: COLORS.terracotta, fontWeight: '600', fontSize: '12px', backgroundColor: 'transparent', cursor: 'pointer' };

// BUSCA ADAPTADA PARA ACESSIBILIDADE
const searchStyle = { width: '100%', padding: '12px 40px 12px 15px', borderRadius: '12px', border: `1.5px solid ${COLORS.border}`, backgroundColor: COLORS.inputBg, color: COLORS.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

const storageBarStyle = { height: '8px', backgroundColor: '#EFEAE6', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' };
const storageFillStyle = { height: '100%' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' };
const cardStyle = { backgroundColor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '15px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' };
const cardTitleStyle = { margin: 0, fontSize: '14px', fontWeight: '500', color: COLORS.text };
const cardCountStyle = { fontSize: '11px', color: '#aaa' };
const iconStyle = { fontSize: '20px', marginBottom: '2px' };
const fileItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.text, fontSize: '13px', textAlign: 'left' };
const fabStyle = { position: 'absolute', bottom: '20px', right: '20px', width: '54px', height: '54px', borderRadius: '27px', backgroundColor: COLORS.terracotta, color: 'white', fontSize: '28px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(192,141,124,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, borderRadius: '24px' };
const modalContent = { backgroundColor: COLORS.bg, padding: '20px', borderRadius: '20px', width: '100%' };
const modalDashStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '16px', border: `1px solid ${COLORS.border}` };
const uploadAreaStyle = { border: `1.5px dashed ${COLORS.terracotta}`, borderRadius: '12px', padding: '30px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: COLORS.terracotta, cursor: 'pointer' };
const cameraToggleBtn = { marginTop: '5px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
const actionBtn = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sage, color: 'white', marginTop: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.text, cursor: 'pointer', fontSize: '13px' };
const concluirBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sage, color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };

export default App;