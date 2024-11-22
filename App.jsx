// src/App.jsx
import React, { useState } from "react";
import { Button, TextInput, Text, Alert } from "evergreen-ui"; // Importa Alert
import * as XLSX from "xlsx";

const App = () => {
    const [data, setData] = useState([]); // Inicializa como array vazio
    const [search, setSearch] = useState("");
    const [presentes, setPresentes] = useState(new Set());
    const [alertMessage, setAlertMessage] = useState(""); // Estado para a mensagem de alerta
    const [currentPage, setCurrentPage] = useState(0); // Estado para a página atual
    const itemsPerPage = 10; // Número de itens por página

    function removeHeaderAndExport(worksheet) {
        // Converter a planilha para um array de objetos
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Remover a primeira linha (cabeçalho)
        data.shift();

        // Criar uma nova planilha sem o cabeçalho
        const newWorksheet = XLSX.utils.aoa_to_sheet(data);

        // Adicionar a nova planilha ao workbook
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1"); // Definindo um nome de planilha padrão

        // Exportar o novo arquivo XLSX
        const newFilePath = "new-file.xlsx";

        console.log(`Novo arquivo exportado: ${newFilePath}`);

        return newWorkbook; // Retornando o novo workbook para uso posterior
    }
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];

        if (!file) {
            console.error("Nenhum arquivo selecionado.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const binaryStr = e.target.result;
            const workbook = XLSX.read(binaryStr, { type: "binary" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Exporta o novo arquivo sem cabeçalho
            const exportedWorkbook = removeHeaderAndExport(worksheet);

            // Converte a nova planilha em JSON
            const jsonData = XLSX.utils.sheet_to_json(
                exportedWorkbook.Sheets["Sheet1"]
            ); // Use o nome da planilha que você definiu

            console.log(jsonData); // Verifique se os dados estão sendo exibidos corretamente
            // Mapeia os dados para garantir que usamos as colunas corretas




            const mappedData = jsonData.map((aluno) => ({
                nome: aluno["Nome"] || aluno["nome"], // Verifique se a chave é 'Nome' ou 'nome'
                idade: aluno["Idade"] || aluno["idade"], // Verifique se a chave é 'Idade' ou 'idade'
                telefone: formatPhoneNumber(aluno["Pessoas para contato"] || aluno["pessoas para contato"])
                
            }));

            setData(mappedData);

            // Exibe a mensagem de alerta informando que o arquivo foi carregado com sucesso
            setAlertMessage("Arquivo carregado com sucesso!");
            setTimeout(() => {
                setAlertMessage("");
            }, 2000); // Limpa a mensagem após 2 segundos
        };
        reader.readAsBinaryString(file);
    };

    const formatPhoneNumber = (phoneNumber) => {
      if(phoneNumber != undefined){
      // Remove caracteres não numéricos
      const cleaned = phoneNumber.replace(/\D/g, '');
      const minified = cleaned.slice(0,10)
      // Verifica se o número tem o comprimento correto (11 dígitos para celular com DDD)
      console.log(minified)
      if (minified.length === 11) {
        return `(${minified.slice(0, 2)}) ${minified.slice(2, 7)}-${minified.slice(7)}`;
        }}
            return ''; // Retorna vazio se não for um número válido
    };

    const handlePresenteClick = (nome) => {
        setPresentes((prev) => {
            const newPresentes = new Set(prev);
            newPresentes.add(nome); // Adiciona o nome ao conjunto de presentes
            return newPresentes;
        });

        // Exibe a mensagem de alerta usando Alert
        setAlertMessage("Presente");
        setTimeout(() => {
            setAlertMessage("");
        }, 2000); // Limpa a mensagem após 2 segundos
    };

    const handleFinalizarChamada = () => {
        // Filtra apenas os alunos que não compareceram
        const alunosNaoCompareceram = data.filter(
            (aluno) => !presentes.has(aluno.nome)
        );

        // Cria um novo array com a coluna "Situação"
        const chamadaComSituacao = alunosNaoCompareceram.map((aluno) => ({
            ...aluno,
            situacao: "Não compareceu", // Define a situação como "Não compareceu"
        }));

        const novaPlanilha = XLSX.utils.json_to_sheet(chamadaComSituacao);
        const novaPasta = XLSX.utils.book_new();

        // Verifica se a planilha já existe e renomeia se necessário
        let sheetName = "Menores de 18";
        let existingSheets = novaPasta.SheetNames;

        while (existingSheets.includes(sheetName)) {
            sheetName += " (1)"; // Adiciona um sufixo se o nome já existir
        }

        XLSX.utils.book_append_sheet(novaPasta, novaPlanilha, sheetName);

        // Obter a data atual e formatá-la
        const today = new Date();
        const formattedDate = `${today.getDate()}-${
            today.getMonth() + 1
        }-${today.getFullYear()}`;

        // Salvar o arquivo com a data no nome
        XLSX.writeFile(
            novaPasta,
            `chamada_menores_de_18_${formattedDate}.xlsx`
        );
    };

    // Calcular os índices dos itens da página atual
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: "#f0f0f0",
            }}
        >
            {/* Título acima do box */}
            <h1 style={{ color: "#4287f5", marginBottom: "16px" }}>
                Sistema de Chamada de Pais
            </h1>

            <div
                style={{
                    backgroundColor: "#ffffff",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    width: "700px", // Definindo uma largura fixa para o box
                }}
            >
                {/* Exibe a mensagem de alerta */}
                {alertMessage && (
                    <Alert intent="success" marginBottom={16}>
                        {alertMessage}
                    </Alert>
                )}

                {/* Botão estilizado para escolher arquivo */}
                {data.length === 0 && (
                    <label htmlFor="file-upload" style={{ width: "100%" }}>
                        <Button
                            intent="primary"
                            style={{ width: "100%", marginBottom: "10px" }}
                            onClick={() =>
                                document.getElementById("file-upload").click()
                            } // Aciona o input file ao clicar no botão
                        >
                            Adicionar Arquivo
                        </Button>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileUpload}
                            style={{ display: "none" }} // Oculta o input file padrão
                        />
                    </label>
                )}

                <TextInput
                    placeholder="Pesquise o nome do aprendiz..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: "10px" }}
                />

                <div>
                    {/* Renderiza a lista apenas se o comprimento da pesquisa for maior ou igual a 2 */}
                    {search.length >= 2 &&
                        data
                            .filter(
                                (aluno) =>
                                    aluno.nome &&
                                    aluno.nome
                                        .toLowerCase()
                                        .includes(search.toLowerCase())
                            )
                            .slice(startIndex, endIndex)
                            .map((aluno) => (
                                <div key={aluno.nome}>
                                    {/* Exibe o botão e nome se não estiver presente */}
                                    {!presentes.has(aluno.nome) ? (
                                        <>
                                            <Button
                                                intent="primary"
                                                onClick={() =>
                                                    handlePresenteClick(
                                                        aluno.nome
                                                    )
                                                }
                                                style={{ marginRight: "10px" }}
                                            >
                                                Presente
                                            </Button>
                                            {/* Exibe o nome do aprendiz */}
                                            <span>
                                                {aluno.nome} ({aluno.idade}{" "}
                                                anos)
                                            </span>{" "}
                                            {/* Acessando o nome do aluno */}
                                        </>
                                    ) : (
                                        <span>Presente</span> // Exibe "Presente" se já foi clicado
                                    )}
                                </div>
                            ))}
                </div>

                {/* Botões de paginação */}
                <div
                    style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <Button
                        intent="secondary"
                        onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 0))
                        }
                        disabled={currentPage === 0}
                    >
                        Anterior
                    </Button>
                    <Button
                        intent="secondary"
                        onClick={() =>
                            setCurrentPage((prev) =>
                                data.filter(
                                    (aluno) =>
                                        aluno.nome &&
                                        aluno.nome
                                            .toLowerCase()
                                            .includes(search.toLowerCase())
                                ).length >
                                (prev + 1) * itemsPerPage
                                    ? prev + 1
                                    : prev
                            )
                        }
                        disabled={
                            (currentPage + 1) * itemsPerPage >=
                            data.filter(
                                (aluno) =>
                                    aluno.nome &&
                                    aluno.nome
                                        .toLowerCase()
                                        .includes(search.toLowerCase())
                            ).length
                        }
                    >
                        Próximo
                    </Button>
                </div>

                <Button intent="success" onClick={handleFinalizarChamada}>
                    Finalizar Chamada
                </Button>
            </div>
        </div>
    );
};

export default App;
