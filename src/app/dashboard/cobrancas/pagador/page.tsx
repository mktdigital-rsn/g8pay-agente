"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { cobrancaDataAtom, cobrancaHtmlAtom } from "@/store/pagamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, MapPin, Hash, Building2, ArrowLeft, Send, Loader2, Badge, Phone } from "lucide-react";
import { cleanTaxNumber, cleanCep, removeAccents, cn } from "@/lib/utils";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Repeat, CalendarCheck, Layers } from "lucide-react";

export default function PagadorDataPage() {
  const router = useRouter();
  const [cobrancaData, setCobrancaData] = useAtom(cobrancaDataAtom);
  const [, setCobrancaHtml] = useAtom(cobrancaHtmlAtom);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);

  const [formData, setFormData] = React.useState({
    pagadorNome: cobrancaData.pagadorNome,
    pagadorTaxNumber: cobrancaData.pagadorTaxNumber,
    pagadorEmail: cobrancaData.pagadorEmail,
    pagadorCep: cobrancaData.pagadorCep,
    pagadorBairro: cobrancaData.pagadorBairro,
    pagadorRua: cobrancaData.pagadorRua,
    pagadorCidade: cobrancaData.pagadorCidade,
    pagadorUf: cobrancaData.pagadorUf,
    pagadorNumero: cobrancaData.pagadorNumero,
    pagadorComplemento: cobrancaData.pagadorComplemento || "",
    pagadorTelefone: cobrancaData.pagadorTelefone || "",
    dataVencimento: cobrancaData.dataVencimento || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [isRecorrente, setIsRecorrente] = React.useState(false);
  const [diaVencimento, setDiaVencimento] = React.useState(new Date().getDate());
  const [quantidadeMeses, setQuantidadeMeses] = React.useState(2);

  const handleCepBlur = async () => {
    const cep = cleanCep(formData.pagadorCep);
    if (cep.length === 8) {
      setIsCepLoading(true);
      try {
        const response = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        const { street, neighborhood, city, state } = response.data;
        setFormData(prev => ({
          ...prev,
          pagadorRua: street || "",
          pagadorBairro: neighborhood || "",
          pagadorCidade: city || "",
          pagadorUf: state || "",
        }));
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRecorrente) {
      if (
        !formData.pagadorNome?.trim() || 
        !formData.pagadorTaxNumber?.trim() || 
        !formData.pagadorEmail?.trim() || 
        !formData.pagadorTelefone?.trim() || 
        !formData.pagadorCep?.trim() || 
        !formData.pagadorNumero?.trim() || 
        !formData.pagadorRua?.trim() || 
        !formData.pagadorBairro?.trim() || 
        !formData.pagadorCidade?.trim() || 
        !formData.pagadorUf?.trim() || 
        !formData.pagadorComplemento?.trim()
      ) {
        toast.error("Para cobranças recorrentes, todos os campos do endereço (incluindo Telefone e Complemento) são obrigatórios.");
        return;
      }
      
      if (!diaVencimento || !quantidadeMeses) {
        toast.error("Por favor, preencha o dia de vencimento e a quantidade de meses.");
        return;
      }
    } else {
      if (!formData.pagadorNome || !formData.pagadorTaxNumber || !formData.pagadorEmail || !formData.pagadorCep || !formData.pagadorNumero) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const generatePayload = (vencimento: string) => ({
        valor: cobrancaData.valor,
        pagadorNome: removeAccents(formData.pagadorNome),
        pagadorTaxNumber: cleanTaxNumber(formData.pagadorTaxNumber),
        pagadorCep: cleanCep(formData.pagadorCep),
        pagadorPessoaTipo: cleanTaxNumber(formData.pagadorTaxNumber).length > 11 ? "legal" : "natural",
        pagadorBairro: removeAccents(formData.pagadorBairro),
        pagadorRua: removeAccents(`${formData.pagadorRua}, ${formData.pagadorNumero}`),
        pagadorEmail: formData.pagadorEmail.toLowerCase().trim(),
        complemento: removeAccents(formData.pagadorComplemento),
        dataVencimento: vencimento,
      });

      if (isRecorrente) {
        const toastId = toast.loading(`Criando grupo de cobrança recorrente...`);
        try {
          // Calcular a primeira data de vencimento
          const now = new Date();
          let firstDateObj = new Date(now.getFullYear(), now.getMonth(), diaVencimento);
          
          // Se o dia de vencimento já passou no mês atual, começa no próximo mês
          if (firstDateObj < now) {
            firstDateObj.setMonth(firstDateObj.getMonth() + 1);
          }
          
          // Ajuste para meses curtos (ex: dia 31 em fevereiro)
          if (firstDateObj.getDate() !== diaVencimento) {
            firstDateObj.setDate(0);
          }

          const firstDate = firstDateObj.toISOString().split('T')[0];
          
          // Ajuste conforme feedback e comportamento observado: 
          // O 'vencimento' do settings (root) deve ser a data final da série (expiração do grupo)
          // O 'vencimento' da recorrencia (inner) deve ser a data inicial (primeira parcela)
          const endDateObj = new Date(firstDateObj);
          endDateObj.setMonth(endDateObj.getMonth() + (quantidadeMeses - 1));
          
          // Ajuste para meses curtos no final da série
          if (endDateObj.getDate() !== diaVencimento && diaVencimento > 28) {
            endDateObj.setDate(0);
          }
          const recurrenceEndDate = endDateObj.toISOString().split('T')[0];

          // 1. Definindo o Modelo de Cobrança (Grupo)
          const groupNameInput = `REC-${formData.pagadorNome.split(' ')[0].toUpperCase()}-${Date.now()}`;

          const groupRes = await api.post("/api/banco/cobranca-grupo", {
            nome: groupNameInput,
            valor: cobrancaData.valor,
            vencimento: recurrenceEndDate, // DATA FINAL DA SÉRIE NO TOPO (EXPIRAÇÃO DO GRUPO)
            tipo: "common",
            descricao: `Recorrência de ${quantidadeMeses} meses para ${formData.pagadorNome}`,
            recorrencia: {
              quantidade: quantidadeMeses,
              frequencia: 30, // dias
              vencimento: firstDate // DATA INICIAL DA SÉRIE (PRIMEIRO BOLETO)
            }
          });

          // O ID REAL (Hash) vem no campo data conforme feedback do back
          let groupId = groupNameInput;
          if (typeof groupRes.data === 'string') {
            groupId = groupRes.data;
          } else if (groupRes.data && typeof groupRes.data.data === 'string') {
            groupId = groupRes.data.data;
          } else if (groupRes.data && typeof groupRes.data.id === 'string') {
            groupId = groupRes.data.id;
          }

          // 2. Cadastro dos Pagadores (Item) - Usando o ID (Hash)
          await api.post(`/api/banco/cobranca-grupo/${groupId}/item`, {
            nome: removeAccents(formData.pagadorNome),
            documento: cleanTaxNumber(formData.pagadorTaxNumber),
            cep: cleanCep(formData.pagadorCep),
            cidade: removeAccents(formData.pagadorCidade),
            bairro: removeAccents(formData.pagadorBairro),
            endereco: removeAccents(formData.pagadorRua),
            uf: formData.pagadorUf,
            numero: formData.pagadorNumero,
            complemento: removeAccents(formData.pagadorComplemento),
            email: formData.pagadorEmail.toLowerCase().trim(),
            telefone: formData.pagadorTelefone.replace(/\D/g, "") || "11999999999"
          });

          // 3. Geração dos Boletos (Trigger Bulk) - Usando o ID (Hash)
          await api.post(`/api/banco/cobranca-grupo/${groupId}/gerar-boletos`);

          toast.dismiss(toastId);
          toast.success("Processamento em lote iniciado com sucesso!");

          let cobrancaResults: any[] = [];
          try {
            // 4. Listar Itens - Usando o ID (Hash)
            const itemsRes = await api.get(`/api/banco/cobranca-grupo/${groupId}/itens`);
            const items = itemsRes.data?.data || itemsRes.data?.items || itemsRes.data || [];

            if (Array.isArray(items) && items.length > 0) {
              cobrancaResults = items.map((item: any) => ({
                html: item.html || item.boletoHtml || item.boleto_html || "",
                dataVencimento: item.vencimento || item.dueDate || item.dataVencimento,
                isPlaceholder: !(item.html || item.boletoHtml || item.boleto_html)
              }));

              if (cobrancaResults[0]?.html) {
                setCobrancaHtml(cobrancaResults[0].html);
              } else {
                setCobrancaHtml("<h1>PROCESSANDO</h1><p>Seus boletos estão sendo registrados. Em alguns instantes eles aparecerão no seu painel.</p>");
              }
            } else {
              setCobrancaHtml("<h1>SOLICITAÇÃO RECEBIDA</h1><p>O grupo de cobrança foi criado e os boletos estão na fila de registro.</p>");
            }
          } catch (e) {
            console.warn("Could not fetch items immediately", e);
            setCobrancaHtml("<h1>GRUPO REGISTRADO</h1><p>Sua solicitação de cobrança em lote foi recebida com sucesso.</p>");
          }

          setCobrancaData({
            ...cobrancaData,
            ...formData,
            dataVencimento: firstDate, // GARANTIR QUE A PRIMEIRA DATA ESTÁ NO STORE
            isRecorrente: true,
            quantidadeMeses,
            groupName: groupId, // SALVANDO O ID (HASH) PARA O POLLING NA TELA DE SUCESSO
            results: cobrancaResults
          });

          router.push("/dashboard/cobrancas/sucesso");
        } catch (err) {
          toast.dismiss(toastId);
          throw err;
        }
      } else {
        const payload = generatePayload(formData.dataVencimento);
        const response = await api.post("/api/banco/pagamentos/gerar-boleto-cobranca", payload, {
          responseType: 'text',
          transformResponse: [(data) => data]
        });

        if (response.data) {
          setCobrancaHtml(response.data);
          setCobrancaData({ ...cobrancaData, ...formData, isRecorrente: false });
          router.push("/dashboard/cobrancas/sucesso");
        }
      }
    } catch (error: any) {
      console.error("❌ [COBRANCA ERROR]:", error);
      toast.error("Erro ao gerar as cobranças. Verifique os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto p-4 md:p-10">
      <div className="mb-10 flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="p-3 hover:bg-neutral-100 rounded-sm transition-colors text-[#0c0a09] border border-transparent hover:border-[var(--brand-accent)]"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <Badge className="bg-[var(--brand-accent)] text-white border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-sm mb-2 shadow-lg shadow-orange-500/20">Aguardando Dados</Badge>
          <h1 className="text-4xl font-black text-[#0c0a09] tracking-tighter uppercase mb-2">Dados do Pagador</h1>
          <p className="text-neutral-500 font-medium italic">Falta pouco! Preencha as informações de quem irá realizar o pagamento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Dados Pessoais */}
          <Card className="border-none shadow-2xl bg-white rounded-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--brand-accent)]" />
            <CardHeader className="border-b border-neutral-50 p-8 bg-neutral-50/30">
              <CardTitle className="text-xl font-black uppercase flex items-center gap-3 text-[#0c0a09]">
                <User className="h-5 w-5 text-[var(--brand-accent)]" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Nome Completo / Razão Social</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                  <Input
                    value={formData.pagadorNome}
                    onChange={(e) => setFormData({ ...formData, pagadorNome: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="pl-12 h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">CPF ou CNPJ</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                  <Input
                    value={formData.pagadorTaxNumber}
                    onChange={(e) => setFormData({ ...formData, pagadorTaxNumber: e.target.value })}
                    placeholder="Somente números"
                    className="pl-12 h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                  <Input
                    type="email"
                    value={formData.pagadorEmail}
                    onChange={(e) => setFormData({ ...formData, pagadorEmail: e.target.value })}
                    placeholder="cliente@email.com"
                    className="pl-12 h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">
                  {isRecorrente ? "Telefone de Contato (Obrigatório em Recorrência)" : "Telefone de Contato"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                  <Input
                    value={formData.pagadorTelefone}
                    onChange={(e) => setFormData({ ...formData, pagadorTelefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="pl-12 h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-sm border border-orange-100/50 group hover:border-orange-500/30 transition-all">
                  <div className="space-y-1">
                    <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)] flex items-center gap-2">
                      <Repeat className={cn("h-4 w-4 transition-all", isRecorrente ? "rotate-180 text-orange-600" : "text-neutral-400")} />
                      Cobrança Recorrente
                    </label>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Gerar vários boletos mensais automaticamente</p>
                  </div>
                  <Switch
                    checked={isRecorrente}
                    onCheckedChange={setIsRecorrente}
                    className="data-[state=checked]:bg-[var(--brand-accent)]"
                  />
                </div>

                {isRecorrente ? (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--brand-accent)] flex items-center gap-2">
                        <CalendarCheck className="h-3.5 w-3.5" /> Dia do Venc.
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={diaVencimento}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val === "" || (Number(val) >= 1 && Number(val) <= 31)) {
                            setDiaVencimento(val === "" ? 0 : Number(val));
                          }
                        }}
                        className="h-12 bg-neutral-50 border-neutral-100 font-black focus:border-[var(--brand-accent)] transition-all rounded-sm text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--brand-accent)] flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" /> Qtd. Meses
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={quantidadeMeses}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val === "" || (Number(val) >= 1 && Number(val) <= 24)) {
                            setQuantidadeMeses(val === "" ? 0 : Number(val));
                          }
                        }}
                        className="h-12 bg-neutral-50 border-neutral-100 font-black focus:border-[var(--brand-accent)] transition-all rounded-sm text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Data de Vencimento</label>
                    <Input
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                      className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="border-none shadow-2xl bg-white rounded-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--brand-accent)]" />
            <CardHeader className="border-b border-neutral-50 p-8 bg-neutral-50/30">
              <CardTitle className="text-xl font-black uppercase flex items-center gap-3 text-[#0c0a09]">
                <MapPin className="h-5 w-5 text-[var(--brand-accent)]" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">CEP</label>
                  <div className="relative">
                    <Input
                      value={formData.pagadorCep}
                      onChange={(e) => setFormData({ ...formData, pagadorCep: e.target.value })}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                    />
                    {isCepLoading && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--brand-accent)]" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Número</label>
                  <Input
                    value={formData.pagadorNumero}
                    onChange={(e) => setFormData({ ...formData, pagadorNumero: e.target.value })}
                    placeholder="123"
                    className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Rua / Logradouro</label>
                <Input
                  value={formData.pagadorRua}
                  onChange={(e) => setFormData({ ...formData, pagadorRua: e.target.value })}
                  placeholder="Nome da rua"
                  className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Bairro</label>
                <Input
                  value={formData.pagadorBairro}
                  onChange={(e) => setFormData({ ...formData, pagadorBairro: e.target.value })}
                  placeholder="Seu bairro"
                  className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">
                  {isRecorrente ? "Complemento (Obrigatório em Recorrência)" : "Complemento (Opcional)"}
                </label>
                <Input
                  value={formData.pagadorComplemento}
                  onChange={(e) => setFormData({ ...formData, pagadorComplemento: e.target.value })}
                  placeholder="Ex: Apto 101, Sala 2"
                  className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Cidade</label>
                  <Input
                    value={formData.pagadorCidade}
                    onChange={(e) => setFormData({ ...formData, pagadorCidade: e.target.value })}
                    placeholder="Cidade"
                    className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-widest text-[var(--brand-accent)]">UF</label>
                  <Input
                    value={formData.pagadorUf}
                    onChange={(e) => setFormData({ ...formData, pagadorUf: e.target.value })}
                    placeholder="UF"
                    className="h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] focus:ring-0 rounded-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-neutral-400 font-bold text-sm">
            <div className="p-2 bg-[var(--brand-accent)]/10 rounded-sm border border-[var(--brand-accent)]/20">
              <Hash className="h-4 w-4 text-[var(--brand-accent)]" />
            </div>
            Valor selecionado: <span className="text-[#0c0a09] font-black text-xl tracking-tighter">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cobrancaData.valor)}</span>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-24 bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white rounded-sm text-2xl font-black uppercase tracking-[0.3em] transition-all shadow-2xl relative overflow-hidden group"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span className="relative z-10">Gerar Cobrança Agora</span>
                <Send className="ml-3 h-6 w-6 relative z-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                <div className="absolute inset-0 bg-[var(--brand-accent)] opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-full group-hover:translate-x-0" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest text-center">
            Ao clicar em gerar, o boleto será registrado no Banco Central e o PDF estará disponível.
          </p>
        </div>
      </form>
    </div>
  );
}
