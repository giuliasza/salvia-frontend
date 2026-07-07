import React, { useState, useRef, useEffect } from 'react';

const COLORS = {
  bg: '#FAF7F5',
  terracotta: '#C08D7C',
  sage: '#8C9C84',
  border: '#D6C8C0',
  text: '#7A6B63',
  inputBg: '#FFFFFF',
  error: '#D98E82'
};

// CSS Injetado para Responsividade Absoluta (Desktop vs Mobile)
const RESPONSIVE_CSS = `
  .aegis-wrapper {
    background-color: #EFEAE6;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
  .aegis-container {
    background-color: ${COLORS.bg};
    width: 100%;
    height: 100vh;
    padding: 25px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow-y: auto;
    box-sizing: border-box;
    transition: all 0.3s ease;
  }
  .recipes-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
    margin-top: 20px;
  }
  .vault-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 15px;
  }

  /* --- MUDANÇA DE COMPORTAMENTO PARA DESKTOP (TELAS MAIORES) --- */
  @media (min-width: 768px) {
    .aegis-wrapper {
      padding: 30px;
    }
    .aegis-container {
      width: 95%;
      max-width: 1150px;
      height: 85vh;
      max-height: 800px;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0px 15px 45px rgba(0, 0, 0, 0.06);
    }
    .recipes-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 25px;
    }
    .vault-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .desktop-row {
      display: flex;
      gap: 30px;
      align-items: flex-start;
      margin-top: 20px;
    }
    .desktop-col-left {
      flex: 1;
    }
    .desktop-col-right {
      width: 350px;
      background: white;
      padding: 20px;
      border-radius: 16px;
      border: 1px solid ${COLORS.border};
    }
  }
`;

const RECIPES_DATA = {
  cheesecake: {
    title: "Cheesecake de Frutas Vermelhas",
    desc: "Uma sobremesa clássica, com base crocante de biscoito, recheio cremoso à base de cream cheese e uma calda azedinha artesanal.",
    prep: "1. Triture os biscoitos e misture com manteiga derretida para forrar a forma.\n2. Bata o cream cheese com açúcar, ovos e raspas de limão.\n3. Despeje na forma e asse em banho-maria por 50 minutos.\n4. Deixe esfriar e cubra com a calda de morangos e amoras antes de gelar por 4 horas."
  },
  cenoura: {
    title: "Bolo de Cenoura Fofinho",
    desc: "O queridinho dos cafés da tarde. Massa aerada feita no liquidificador com uma cobertura de chocolate que craquela ao esfriar.",
    prep: "1. Bata no liquidificador as cenouras picadas, ovos e óleo.\n2. Transfira para uma tigela e misture o açúcar e a farinha de trigo peneirada.\n3. Adicione o fermento e asse por 40 minutos a 180°C.\n4. Faça a calda com chocolate em pó, açúcar, leite e manteiga até ferver, e jogue por cima."
  },
  omelete: {
    title: "Omelete Nutritivo de Legumes",
    desc: "Uma opção rápida, leve e rica em proteínas para o seu almoço ou jantar, recheada com tomates, espinafre fresco e cubos de queijo branco."
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState('camuflagem');
  const [authMode, setAuthMode] = useState('signup');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [arquivosReais, setArquivosReais] = useState([]);

  const [regNome, setRegNome] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const BACKEND_URL = "https://5olqwefd.up.railway.app";

  const triggerNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const verificarSeExisteCadastro = () => {
    return localStorage.getItem('salvia_user_password') !== null;
  };

  const handleVerReceita = (recipeKey) => {
    if (recipeKey === 'omelete') {
      if (verificarSeExisteCadastro()) {
        setAuthMode('login');
      } else {
        setAuthMode('signup');
      }
      setCurrentPage('auth');
    } else {
      setActiveRecipe(recipeKey);
    }
  };

  const handleCadastro = (e) => {
    e.preventDefault();
    if (!regNome || !regCpf || !regSenha) {
      triggerNotification("Por favor, preencha todos os campos.", "error");
      return;
    }
    localStorage.setItem('salvia_user_name', regNome);
    localStorage.setItem('salvia_user_cpf', regCpf);
    localStorage.setItem('salvia_user_password', regSenha);
    triggerNotification("Perfil de acesso configurado com sucesso!", "success");
    setCurrentPage('vault');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginSenha === localStorage.getItem('salvia_user_password')) {
      triggerNotification("Chave validada. Bem-vinda de volta!", "success");
      setCurrentPage('vault');
      setLoginSenha('');
    } else {
      triggerNotification("Chave de acesso incorreta. Tente novamente.", "error");
    }
  };

  const carregarArquivosDoCofre = async () => {
    try {
      const cpfSalvo = localStorage.getItem('salvia_user_cpf') || 'anonimo';
      const response = await fetch(`${BACKEND_URL}/listar-documentos?cpf=${cpfSalvo}`);
      if (response.ok) {
        const dados = await response.json();
        setArquivosReais(dados.arquivos || []);
      }
    } catch (error) {
      console.error("Erro ao conectar com a Magalu Cloud:", error);
    }
  };

  useEffect(() => {
    if (currentPage === 'vault') {
      carregarArquivosDoCofre();
    }
  }, [currentPage]);

  const universalUpload = async (fileData, originalName, mimeType) => {
    setCarregando(true);
    setProgresso(10);
    try {
      const response = await fetch(`${BACKEND_URL}/upload-seguro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: fileData,
          filename: originalName,
          mime_type: mimeType,
          cpf: localStorage.getItem('salvia_user_cpf') || 'anonimo'
        })
      });
      setProgresso(100);
      if (response.ok) {
        setTimeout(() => {
          triggerNotification("Documento criptografado e salvo na Magalu Cloud!", "success");
          setShowUploadModal(false);
          setProgresso(0);
          carregarArquivosDoCofre();
        }, 500);
      } else {
        triggerNotification("Erro na validação do arquivo pelo servidor.", "error");
      }
    } catch (error) {
      triggerNotification("Falha de conexão com o servidor.", "error");
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
    await universalUpload(b64, `captura_${Date.now()}.jpg`, 'image/jpeg');
  };

  const baixarDocumentoReal = async (key) => {
    try {
      const response = await fetch(`${BACKEND_URL}/baixar-documento/${key}`);
      if (response.ok) {
        const dados = await response.json();
        const link = document.createElement('a');
        link.href = dados.download_url;
        link.setAttribute('download', key);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerNotification("Download iniciado com segurança!", "success");
      }
    } catch (error) {
      triggerNotification("Erro ao processar o download.", "error");
    }
  };

  useEffect(() => {
    if (viewMode === 'camera' && showUploadModal) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; });
    }
  }, [viewMode, showUploadModal]);

  const toastStyle = {
    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: toast.type === 'success' ? COLORS.sage : COLORS.error,
    color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    zIndex: 1000, fontSize: '14px', fontWeight: '600', textAlign: 'center', width: '85%', maxWidth: '380px',
    transition: 'all 0.3s ease-in-out', opacity: toast.show ? 1 : 0, visibility: toast.show ? 'visible' : 'hidden'
  };

  return (
    <div className="aegis-wrapper">
      {/* Injeção de Estilo Responsivo Dinâmico */}
      <style>{RESPONSIVE_CSS}</style>

      <div className="aegis-container">

        <div style={toastStyle}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '} {toast.message}
        </div>

        {/* ================= TELA 1: CAMUFLAGEM (RECEITAS) ================= */}
        {currentPage === 'camuflagem' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!activeRecipe ? (
              <div>
                <h2 style={{ color: COLORS.terracotta, marginBottom: '10px', fontWeight: '400', fontSize: '28px', textAlign: 'center' }}>
                  Minhas Receitas Diárias
                </h2>
                <p style={{ color: COLORS.text, fontSize: '14px', marginBottom: '35px', textAlign: 'center' }}>Explore opções saudáveis e fáceis para o seu dia a dia.</p>

                {/* Grid Responsivo automático controlado pelo CSS */}
                <div className="recipes-grid">
                  {Object.keys(RECIPES_DATA).map((key) => (
                    <div key={key} style={recipeCardStyle}>
                      <h3 style={{ margin: '0 0 8px 0', color: COLORS.terracotta, fontSize: '16px' }}>{RECIPES_DATA[key].title}</h3>
                      <p style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: '13px', lineHeight: '1.4', flex: 1 }}>{RECIPES_DATA[key].desc}</p>
                      <button onClick={() => handleVerReceita(key)} style={verReceitaBtn}>Acessar Modo de Preparo</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'left', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
                <button onClick={() => setActiveRecipe(null)} style={{ ...verReceitaBtn, marginBottom: '20px', width: 'auto' }}>← Voltar para Lista</button>
                <h2 style={{ color: COLORS.terracotta, margin: '0 0 15px 0' }}>{RECIPES_DATA[activeRecipe].title}</h2>
                <h4 style={{ color: COLORS.text, margin: '20px 0 10px 0' }}>Passo a Passo:</h4>
                <p style={{ color: COLORS.text, whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.6', backgroundColor: '#FFF', padding: '20px', borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
                  {RECIPES_DATA[activeRecipe].prep}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TELA 2: LOGIN / CADASTRO ================= */}
        {currentPage === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '450px' }}>
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'left' }}>
              <button onClick={() => setCurrentPage('camuflagem')} style={{ ...verReceitaBtn, marginBottom: '20px', width: 'auto' }}>← Cancelar</button>

              {authMode === 'signup' ? (
                <form onSubmit={handleCadastro} style={formStyle}>
                  <h3 style={{ color: COLORS.terracotta, margin: '0 0 10px 0' }}>Criar Perfil de Receitas</h3>
                  <p style={{ color: COLORS.text, fontSize: '13px', marginBottom: '20px' }}>Configure seus dados básicos para salvar suas preferências culinárias.</p>

                  <label style={labelStyle}>Nome Completo</label>
                  <input type="text" value={regNome} onChange={(e) => setRegNome(e.target.value)} style={inputStyle} placeholder="Digite seu nome" required />

                  <label style={labelStyle}>CPF (ID de Registro Único)</label>
                  <input type="text" value={regCpf} onChange={(e) => setRegCpf(e.target.value)} style={inputStyle} placeholder="000.000.000-00" required />

                  <label style={labelStyle}>Criar Senha Numérica</label>
                  <input type="password" value={regSenha} onChange={(e) => setRegSenha(e.target.value)} style={inputStyle} placeholder="Digite sua senha de acesso" required />

                  <button type="submit" style={submitBtnStyle}>Concluir e Entrar</button>
                </form>
              ) : (
                <form onSubmit={handleLogin} style={formStyle}>
                  <h3 style={{ color: COLORS.terracotta, margin: '0 0 10px 0' }}>Desbloquear Receita Especial</h3>
                  <p style={{ color: COLORS.text, fontSize: '13px', marginBottom: '20px' }}>Insira sua chave de acesso para visualizar o conteúdo restrito desta receita.</p>

                  <label style={labelStyle}>Senha de Acesso</label>
                  <input type="password" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} style={inputStyle} placeholder="Digite sua senha" required />

                  <button type="submit" style={submitBtnStyle}>Confirmar Chave</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ================= TELA 3: COFRE DIGITAL REAL ================= */}
        {currentPage === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.text }}>Olá, {localStorage.getItem('salvia_user_name') || 'Usuária'}.</p>
                <h2 style={{ margin: 0, color: COLORS.terracotta, fontSize: '24px', fontWeight: '600' }}>Meus Documentos</h2>
              </div>
              <button onClick={() => setCurrentPage('camuflagem')} style={sairBtn}>SAIR</button>
            </div>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input type="text" placeholder="Buscar arquivos no cofre..." style={searchStyle} />
              <span style={{ position: 'absolute', right: '15px', top: '12px', color: COLORS.terracotta }}>🔍</span>
            </div>

            <div style={storageBarStyle}>
              <div style={{ ...storageFillStyle, width: `${Math.min(arquivosReais.length * 8, 100)}%`, backgroundColor: COLORS.sage }}></div>
            </div>
            <p style={{ fontSize: '11px', textAlign: 'right', color: COLORS.text, marginTop: '4px' }}>
              {arquivosReais.length} documento(s) salvos em ambiente soberano
            </p>

            <div className="vault-grid">
              <div style={cardStyle}><span style={{ fontSize: '20px' }}>📁</span><p style={cardTitleStyle}>Todos os Arquivos</p><span style={cardCountStyle}>{arquivosReais.length} Arq.</span></div>
              <div style={cardStyle}><span style={{ fontSize: '20px' }}>🛡️</span><p style={cardTitleStyle}>ID Usuária (CPF)</p><span style={{ ...cardCountStyle, color: COLORS.terracotta, fontWeight: '600' }}>{localStorage.getItem('salvia_user_cpf')}</span></div>
            </div>

            {/* Layout inteligente de duas colunas paralelas que só ativa no Desktop */}
            <div className="desktop-row">
              <div className="desktop-col-left" style={{ flex: 1 }}>
                <h4 style={{ color: COLORS.terracotta, marginTop: '20px', textAlign: 'left', marginBottom: '10px' }}>Arquivos Criptografados</h4>
                <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                  {arquivosReais.length === 0 ? (
                    <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'left', fontStyle: 'italic', marginTop: '10px' }}>Nenhum documento armazenado em nuvem.</p>
                  ) : (
                    arquivosReais.map((arq) => (
                      <div key={arq.key} style={fileItemStyle}>
                        <div style={{ textAlign: 'left', maxWidth: '75%' }}>
                          <p style={{ margin: 0, fontWeight: '500', color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📄 {arq.key.split('/').pop().length > 37 ? arq.key.split('/').pop().substring(37) : arq.key.split('/').pop()}
                          </p>
                          <span style={{ fontSize: '10px', color: '#aaa' }}>{(arq.tamanho / 1024).toFixed(1)} KB</span>
                        </div>
                        <button onClick={() => baixarDocumentoReal(arq.key)} style={baixarBtnStyle}>Baixar</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Painel Lateral de Ações visível no Desktop */}
              <div className="desktop-col-right" style={{ textAlign: 'left' }}>
                <h4 style={{ color: COLORS.terracotta, margin: '0 0 10px 0' }}>Ações Rápidas</h4>
                <p style={{ fontSize: '13px', color: COLORS.text, marginBottom: '20px' }}>Gerencie ou faça upload de novas mídias protegidas diretamente na Magalu Cloud.</p>
                <button onClick={() => setShowUploadModal(true)} style={{ ...submitBtnStyle, marginTop: 0, width: '100%' }}>+ Adicionar Arquivo</button>
              </div>
            </div>

            {/* Botão flutuante mantido apenas no Mobile por CSS */}
            <button onClick={() => setShowUploadModal(true)} className="mobile-fab" style={fabStyle}>+</button>

            {/* MODAL DE ENVIOS */}
            {showUploadModal && (
              <div style={modalOverlay}>
                <div style={modalContent}>
                  <div style={modalDashStyle}>
                    {viewMode === 'list' ? (
                      <label style={uploadAreaStyle}>
                        <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Selecione um arquivo local ou tire uma foto</p>
                        <button onClick={(e) => { e.preventDefault(); setViewMode('camera'); }} style={cameraToggleBtn}>Usar Câmera AEGIS</button>
                      </label>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <video ref={videoRef} playsInline style={{ width: '100%', borderRadius: '10px', backgroundColor: '#000' }} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <button onClick={capturarFoto} style={actionBtn}>Capturar Documento</button>
                        <button onClick={() => setViewMode('list')} style={{ ...actionBtn, backgroundColor: '#ccc', color: '#333' }}>Voltar</button>
                      </div>
                    )}

                    {progresso > 0 && (
                      <div style={{ width: '100%', marginTop: '15px' }}>
                        <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progresso}%`, backgroundColor: COLORS.sage, transition: '0.3s' }}></div>
                        </div>
                        <p style={{ fontSize: '11px', color: COLORS.sage, margin: '5px 0 0 0' }}>Sincronizando com Magalu Cloud... {progresso}%</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => setShowUploadModal(false)} style={cancelBtn}>Fechar Painel</button>
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

// Estilos estáticos base
const recipeCardStyle = { backgroundColor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' };
const verReceitaBtn = { width: '100%', padding: '10px 15px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' };
const sairBtn = { border: `1.5px solid ${COLORS.terracotta}`, borderRadius: '8px', padding: '6px 14px', color: COLORS.terracotta, fontWeight: '600', fontSize: '12px', backgroundColor: 'transparent', cursor: 'pointer' };
const searchStyle = { width: '100%', padding: '12px 40px 12px 15px', borderRadius: '12px', border: `1.5px solid ${COLORS.border}`, backgroundColor: COLORS.inputBg, color: COLORS.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const storageBarStyle = { height: '8px', backgroundColor: '#EFEAE6', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' };
const storageFillStyle = { height: '100%', transition: '0.5s' };
const cardStyle = { backgroundColor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '15px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' };
const cardTitleStyle = { margin: 0, fontSize: '13px', fontWeight: '500', color: COLORS.text };
const cardCountStyle = { fontSize: '11px', color: '#aaa' };
const fileItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` };
const baixarBtnStyle = { backgroundColor: 'transparent', border: `1px solid ${COLORS.sage}`, color: COLORS.sage, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const fabStyle = { position: 'absolute', bottom: '20px', right: '20px', width: '54px', height: '54px', borderRadius: '27px', backgroundColor: COLORS.terracotta, color: 'white', fontSize: '28px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(192,141,124,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, borderRadius: '24px' };
const modalContent = { backgroundColor: COLORS.bg, padding: '20px', borderRadius: '20px', width: '100%', maxWidth: '400px' };
const modalDashStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '16px', border: `1px solid ${COLORS.border}` };
const uploadAreaStyle = { border: `1.5px dashed ${COLORS.terracotta}`, borderRadius: '12px', padding: '30px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: COLORS.terracotta, cursor: 'pointer' };
const cameraToggleBtn = { marginTop: '5px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
const actionBtn = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sage, color: 'white', marginTop: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.text, cursor: 'pointer', fontSize: '13px' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.01)' };
const labelStyle = { fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '-4px' };
const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: '14px', color: COLORS.text };
const submitBtnStyle = { padding: '12px', backgroundColor: COLORS.terracotta, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px' };

export default App;