import React, { useState, useRef, useEffect } from 'react';

const COLORS = {
  bg: '#FAF7F5',       // Creme de fundo
  terracotta: '#C08D7C', // Títulos, Destaques e Botões Principais
  sage: '#8C9C84',      // Verde para feedback positivo e status
  border: '#D6C8C0',    // Bordas delicadas dos cards
  text: '#7A6B63',      // Texto principal acessível
  inputBg: '#FFFFFF'    // Fundo dos campos de entrada
};

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

  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [arquivosReais, setArquivosReais] = useState([]);

  const [regNome, setRegNome] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regSenha, setRegSenha] = useState('');

  const [loginSenha, setLoginSenha] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const BACKEND_URL = "https://aegis-backendd.up.railway.app";

  const verificarSeExisteCadastro = () => {
    const cadastro = localStorage.getItem('salvia_user_password');
    return cadastro !== null;
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
      alert("Por favor, preencha todos os campos.");
      return;
    }
    localStorage.setItem('salvia_user_name', regNome);
    localStorage.setItem('salvia_user_cpf', regCpf);
    localStorage.setItem('salvia_user_password', regSenha);

    alert("Usuária registrada com sucesso no ID criptografado!");
    setCurrentPage('vault');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const senhaSalva = localStorage.getItem('salvia_user_password');

    if (loginSenha === senhaSalva) {
      setCurrentPage('vault');
      setLoginSenha('');
    } else {
      alert("Senha incorreta. Acesso negado.");
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
          alert("Documento criptografado e salvo na Magalu Cloud!");
          setShowUploadModal(false);
          setProgresso(0);
          carregarArquivosDoCofre();
        }, 500);
      }
    } catch (error) {
      alert("Erro ao enviar arquivo para o servidor.");
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
      }
    } catch (error) {
      alert("Erro ao baixar o arquivo.");
    }
  };

  useEffect(() => {
    if (viewMode === 'camera' && showUploadModal) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; });
    }
  }, [viewMode, showUploadModal]);

  return (
    <div style={responsiveWrapperStyle}>
      <div style={appContainerStyle}>

        {currentPage === 'camuflagem' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!activeRecipe ? (
              <div>
                <h2 style={{ color: COLORS.terracotta, marginBottom: '20px', fontWeight: '400', fontSize: '24px', textAlign: 'center' }}>
                  Minhas Receitas Diárias
                </h2>
                <p style={{ color: COLORS.text, fontSize: '14px', marginBottom: '25px', textAlign: 'center' }}>Explore opções saudáveis e fáceis para o seu dia a dia.</p>

                {Object.keys(RECIPES_DATA).map((key) => (
                  <div key={key} style={recipeCardStyle}>
                    <h3 style={{ margin: '0 0 8px 0', color: COLORS.terracotta, fontSize: '16px' }}>{RECIPES_DATA[key].title}</h3>
                    <p style={{ margin: '0 0 12px 0', color: COLORS.text, fontSize: '13px', lineHeight: '1.4' }}>{RECIPES_DATA[key].desc}</p>
                    <button onClick={() => handleVerReceita(key)} style={verReceitaBtn}>Acessar Modo de Preparo</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <button onClick={() => setActiveRecipe(null)} style={{ ...verReceitaBtn, marginBottom: '20px', width: 'auto' }}>← Voltar para Lista</button>
                <h2 style={{ color: COLORS.terracotta, margin: '0 0 15px 0' }}>{RECIPES_DATA[activeRecipe].title}</h2>
                <h4 style={{ color: COLORS.text, margin: '20px 0 10px 0' }}>Passo a Passo:</h4>
                <p style={{ color: COLORS.text, whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.6', backgroundColor: '#FFF', padding: '15px', borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
                  {RECIPES_DATA[activeRecipe].prep}
                </p>
              </div>
            )}
          </div>
        )}

        {currentPage === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', textAlign: 'left' }}>
            <button onClick={() => setCurrentPage('camuflagem')} style={{ ...verReceitaBtn, marginBottom: '30px', width: 'auto' }}>← Cancelar</button>

            {authMode === 'signup' ? (
              <form onSubmit={handleCadastro} style={formStyle}>
                <h3 style={{ color: COLORS.terracotta, margin: '0 0 10px 0' }}>Criar Perfil de Receitas</h3>
                <p style={{ color: COLORS.text, fontSize: '13px', marginBottom: '20px' }}>Configure seus dados básicos para salvar suas preferências culinárias.</p>

                <label style={labelStyle}>Nome Completo</label>
                <input type="text" value={regNome} onChange={(e) => setRegNome(e.target.value)} style={inputStyle} placeholder="Digite seu nome" />

                <label style={labelStyle}>CPF (ID de Registro Único)</label>
                <input type="text" value={regCpf} onChange={(e) => setRegCpf(e.target.value)} style={inputStyle} placeholder="000.000.000-00" />

                <label style={labelStyle}>Criar Senha Numérica</label>
                <input type="password" value={regSenha} onChange={(e) => setRegSenha(e.target.value)} style={inputStyle} placeholder="Digite sua senha de acesso" />

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
        )}

        {currentPage === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.text }}>Olá, {localStorage.getItem('salvia_user_name') || 'Usuária'}.</p>
                <h2 style={{ margin: 0, color: COLORS.terracotta, fontSize: '22px', fontWeight: '600' }}>Meus Documentos</h2>
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

            <div style={gridStyle}>
              <div style={cardStyle}><span style={{ fontSize: '20px' }}>📁</span><p style={cardTitleStyle}>Todos os Arquivos</p><span style={cardCountStyle}>{arquivosReais.length} Arq.</span></div>
              <div style={cardStyle}><span style={{ fontSize: '20px' }}>🛡️</span><p style={cardTitleStyle}>ID Usuária (CPF)</p><span style={{ ...cardCountStyle, color: COLORS.terracotta, fontWeight: '600' }}>{localStorage.getItem('salvia_user_cpf')}</span></div>
            </div>

            <h4 style={{ color: COLORS.terracotta, marginTop: '25px', textAlign: 'left', marginBottom: '10px' }}>Arquivos Criptografados</h4>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '60px' }}>
              {arquivosReais.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'left', fontStyle: 'italic' }}>Nenhum documento armazenado em nuvem.</p>
              ) : (
                arquivosReais.map((arq) => (
                  <div key={arq.key} style={fileItemStyle}>
                    <div style={{ textAlign: 'left', maxWidth: '70%' }}>
                      <p style={{ margin: 0, fontWeight: '500', color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {arq.key.length > 37 ? arq.key.substring(37) : arq.key}</p>
                      <span style={{ fontSize: '10px', color: '#aaa' }}>{(arq.tamanho / 1024).toFixed(1)} KB</span>
                    </div>
                    <button onClick={() => baixarDocumentoReal(arq.key)} style={baixarBtnStyle}>Baixar</button>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setShowUploadModal(true)} style={fabStyle}>+</button>

            {showUploadModal && (
              <div style={modalOverlay}>
                <div style={modalContent}>
                  <div style={modalDashStyle}>
                    {viewMode === 'list' ? (
                      <label style={uploadAreaStyle}>
                        <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Selecione um arquivo local ou tire uma foto</p>
                        <button onClick={(e) => { e.preventDefault(); setViewMode('camera'); }} style={cameraToggleBtn}>Usar Câmera NVD</button>
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

const responsiveWrapperStyle = { backgroundColor: '#EFEAE6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' };
const appContainerStyle = { backgroundColor: COLORS.bg, width: '100%', maxWidth: '420px', height: '90vh', maxHeight: '820px', borderRadius: '24px', padding: '25px', boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.06)', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' };
const recipeCardStyle = { backgroundColor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '16px', marginBottom: '15px', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' };
const verReceitaBtn = { width: '100%', padding: '10px 15px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: '0.2s' };
const verBtnSecret = { ...verReceitaBtn, borderColor: COLORS.terracotta, color: COLORS.terracotta };
const sairBtn = { border: `1.5px solid ${COLORS.terracotta}`, borderRadius: '8px', padding: '6px 14px', color: COLORS.terracotta, fontWeight: '600', fontSize: '11px', backgroundColor: 'transparent', cursor: 'pointer' };
const searchStyle = { width: '100%', padding: '12px 40px 12px 15px', borderRadius: '12px', border: `1.5px solid ${COLORS.border}`, backgroundColor: COLORS.inputBg, color: COLORS.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const storageBarStyle = { height: '8px', backgroundColor: '#EFEAE6', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' };
const storageFillStyle = { height: '100%', transition: '0.5s' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' };
const cardStyle = { backgroundColor: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '12px 15px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' };
const cardTitleStyle = { margin: 0, fontSize: '13px', fontWeight: '500', color: COLORS.text };
const cardCountStyle = { fontSize: '11px', color: '#aaa' };
const fileItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` };
const baixarBtnStyle = { backgroundColor: 'transparent', border: `1px solid ${COLORS.sage}`, color: COLORS.sage, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const fabStyle = { position: 'absolute', bottom: '20px', right: '20px', width: '54px', height: '54px', borderRadius: '27px', backgroundColor: COLORS.terracotta, color: 'white', fontSize: '28px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(192,141,124,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, borderRadius: '24px' };
const modalContent = { backgroundColor: COLORS.bg, padding: '20px', borderRadius: '20px', width: '100%' };
const modalDashStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '16px', border: `1px solid ${COLORS.border}` };
const uploadAreaStyle = { border: `1.5px dashed ${COLORS.terracotta}`, borderRadius: '12px', padding: '30px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: COLORS.terracotta, cursor: 'pointer' };
const cameraToggleBtn = { marginTop: '5px', backgroundColor: 'transparent', border: `1px solid ${COLORS.terracotta}`, color: COLORS.terracotta, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
const actionBtn = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.sage, color: 'white', marginTop: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.text, cursor: 'pointer', fontSize: '13px' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: `1px solid ${COLORS.border}` };
const labelStyle = { fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '-4px' };
const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: '14px', color: COLORS.text };
const submitBtnStyle = { padding: '12px', backgroundColor: COLORS.terracotta, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px' };

export default App;