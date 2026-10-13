import type { TranslationMessages } from "./types";

/** Validation, persistence, and Solana runtime messages. Spanish is the source language. */
export const domainMessages: TranslationMessages = {
  "Cuentas de prueba acompañadas, sin valor monetario y bajo la firma de tu wallet.": { en: "Guided test accounts with no monetary value, authorized by your wallet signature.", pt: "Contas de teste acompanhadas, sem valor monetário e autorizadas pela assinatura da sua wallet." },
  "Las vistas de demo no son sesiones autenticadas. En testnet, la wallet conectada autoriza las operaciones de prueba sin valor monetario.": { en: "Demo views are not authenticated sessions. On testnet, the connected wallet authorizes test transactions with no monetary value.", pt: "As visualizações da demonstração não são sessões autenticadas. Na testnet, a wallet conectada autoriza operações de teste sem valor monetário." },
  "Conecta una billetera compatible. Las cuentas de testnet se derivan de la wallet del responsable, quien firma cada movimiento de prueba sin valor monetario.": { en: "Connect a compatible wallet. Testnet accounts are derived from the guardian's wallet, which signs every test transaction with no monetary value.", pt: "Conecte uma wallet compatível. As contas da testnet são derivadas da wallet da pessoa responsável, que assina cada operação de teste sem valor monetário." },
  "Los IDs de perfiles creados determinan sus direcciones Solana. Guarda una copia antes de reiniciar si creaste cuentas de testnet.": { en: "Created profile IDs determine their Solana addresses. Save a backup before resetting if you created testnet accounts.", pt: "Os IDs dos perfis criados determinam seus endereços Solana. Salve uma cópia antes de redefinir se criou contas da testnet." },
  "La cuenta existe, pero no es una cuenta de sistema vacía. Se bloquearon las operaciones.": { en: "The account exists, but it is not an empty system account. Transactions have been blocked.", pt: "A conta existe, mas não é uma conta de sistema vazia. As operações foram bloqueadas." },
  "El movimiento": { en: "The transaction", pt: "A movimentação" },
  "El RPC devolvió un saldo mínimo exento de renta inválido.": { en: "The RPC returned an invalid rent-exempt minimum balance.", pt: "O RPC retornou um saldo mínimo de isenção de aluguel inválido." },
  "La billetera del representante debe quedar vacía o conservar su saldo mínimo exento de renta tras la comisión y la operación.": { en: "The guardian's wallet must be empty or retain its rent-exempt minimum balance after the fee and transaction.", pt: "A carteira do responsável deve ficar vazia ou manter o saldo mínimo de isenção de aluguel após a taxa e a operação." },
  "La transacción cambió antes de firmarse. No se envió.": { en: "The transaction changed before signing. It was not sent.", pt: "A transação mudou antes da assinatura. Ela não foi enviada." },
  "El RPC devolvió un saldo inválido para la billetera del representante.": { en: "The RPC returned an invalid balance for the guardian's wallet.", pt: "O RPC retornou um saldo inválido para a carteira do responsável." },
  "El monto": { en: "The amount", pt: "O valor" },
  "La recarga": { en: "The top-up", pt: "A recarga" },
  "El saldo": { en: "The balance", pt: "O saldo" },
  "El gasto": { en: "The expense", pt: "A despesa" },
  "El límite por gasto": { en: "The per-expense limit", pt: "O limite por despesa" },
  "El ahorro": { en: "Savings", pt: "A economia" },
  "La meta": { en: "The goal", pt: "A meta" },
  "El ahorro acumulado": { en: "Total savings", pt: "A economia acumulada" },
  "La recompensa": { en: "The reward", pt: "A recompensa" },
  "{label} debe ser una cantidad válida y no negativa.": { en: "{label} must be a valid, non-negative amount.", pt: "{label} deve ser uma quantia válida e não negativa." },
  "{label} debe tener como máximo dos decimales y estar dentro del límite permitido.": { en: "{label} must have at most two decimal places and be within the allowed limit.", pt: "{label} deve ter no máximo duas casas decimais e estar dentro do limite permitido." },
  "El monto supera el límite de precisión permitido.": { en: "The amount exceeds the permitted precision limit.", pt: "O valor excede o limite de precisão permitido." },
  "{label} debe ser mayor que cero.": { en: "{label} must be greater than zero.", pt: "{label} deve ser maior que zero." },
  "Esta acción solo está disponible con dinero de práctica.": { en: "This action is only available with practice money.", pt: "Esta ação só está disponível com dinheiro de prática." },
  "El tipo de dinero no es válido.": { en: "The money type is not valid.", pt: "O tipo de dinheiro não é válido." },
  "No encontramos este perfil. Actualiza la página e inténtalo de nuevo.": { en: "We couldn't find this profile. Refresh the page and try again.", pt: "Não encontramos este perfil. Atualize a página e tente novamente." },
  "No encontramos este movimiento. Actualiza la página e inténtalo de nuevo.": { en: "We couldn't find this transaction. Refresh the page and try again.", pt: "Não encontramos esta movimentação. Atualize a página e tente novamente." },
  "Revisa los datos del perfil e inténtalo de nuevo.": { en: "Check the profile details and try again.", pt: "Confira os dados do perfil e tente novamente." },
  "El nombre y el vínculo deben ser texto.": { en: "The name and relationship must be text.", pt: "O nome e o vínculo devem ser texto." },
  "Escribe el nombre de la persona.": { en: "Enter the person's name.", pt: "Digite o nome da pessoa." },
  "Cuéntanos qué vínculo tienes con esta persona.": { en: "Tell us how you are related to this person.", pt: "Conte qual é o seu vínculo com essa pessoa." },
  "Este perfil está en pausa. Reanúdalo para hacer cambios.": { en: "This profile is paused. Resume it to make changes.", pt: "Este perfil está pausado. Retome-o para fazer alterações." },
  "Este perfil está en pausa. Reanúdalo para aprobar gastos.": { en: "This profile is paused. Resume it to approve expenses.", pt: "Este perfil está pausado. Retome-o para aprovar despesas." },
  "El saldo supera el límite permitido.": { en: "The balance exceeds the allowed limit.", pt: "O saldo excede o limite permitido." },
  "El gasto supera el límite establecido para este perfil.": { en: "The expense exceeds this profile's spending limit.", pt: "A despesa excede o limite definido para este perfil." },
  "No hay suficientes Brotes disponibles para este gasto.": { en: "There aren't enough Brotes available for this expense.", pt: "Não há Brotes suficientes disponíveis para esta despesa." },
  "No encontramos esta meta. Actualiza la página e inténtalo de nuevo.": { en: "We couldn't find this goal. Refresh the page and try again.", pt: "Não encontramos esta meta. Atualize a página e tente novamente." },
  "No hay suficientes Brotes disponibles para ahorrar esa cantidad.": { en: "There aren't enough Brotes available to save that amount.", pt: "Não há Brotes suficientes disponíveis para economizar esse valor." },
  "Esa cantidad supera lo que falta para completar la meta.": { en: "That amount is more than what's needed to reach the goal.", pt: "Esse valor é maior do que falta para atingir a meta." },
  "Escribe un nombre para la meta.": { en: "Enter a name for the goal.", pt: "Digite um nome para a meta." },
  "No se encontró la misión.": { en: "The mission could not be found.", pt: "A missão não foi encontrada." },
  "La experiencia debe ser un número entero igual o mayor que cero.": { en: "Experience must be a whole number greater than or equal to zero.", pt: "A experiência deve ser um número inteiro maior ou igual a zero." },
  "La experiencia acumulada supera el límite permitido.": { en: "The accumulated experience exceeds the allowed limit.", pt: "A experiência acumulada excede o limite permitido." },
  "Esta misión ya se completó y su recompensa fue entregada.": { en: "This mission is already complete and its reward has been delivered.", pt: "Esta missão já foi concluída e sua recompensa foi entregue." },
  "Solo se pueden revisar gastos de práctica.": { en: "Only practice expenses can be reviewed.", pt: "Só é possível revisar despesas de prática." },
  "Este gasto ya fue revisado.": { en: "This expense has already been reviewed.", pt: "Esta despesa já foi revisada." },
  "El gasto supera el límite actual de este perfil.": { en: "The expense exceeds this profile's current limit.", pt: "A despesa excede o limite atual deste perfil." },
  "No hay suficientes Brotes para aprobar este gasto.": { en: "There aren't enough Brotes to approve this expense.", pt: "Não há Brotes suficientes para aprovar esta despesa." },
  "Revisa las reglas del perfil e inténtalo de nuevo.": { en: "Check the profile rules and try again.", pt: "Confira as regras do perfil e tente novamente." },

  "Los datos guardados no se pudieron leer. Descarga el registro original antes de reemplazarlo.": { en: "The saved data couldn't be read. Download the original record before replacing it.", pt: "Não foi possível ler os dados salvos. Baixe o registro original antes de substituí-lo." },
  "Este navegador no permite leer los datos guardados.": { en: "This browser does not allow saved data to be read.", pt: "Este navegador não permite ler os dados salvos." },
  "Los datos de este navegador necesitan recuperación antes de usar Solana.": { en: "This browser's data must be recovered before using Solana.", pt: "Os dados deste navegador precisam ser recuperados antes de usar Solana." },
  "Guarda el perfil en este navegador antes de usar Solana.": { en: "Save the profile in this browser before using Solana.", pt: "Salve o perfil neste navegador antes de usar Solana." },
  "Este perfil ya no está guardado en este navegador.": { en: "This profile is no longer saved in this browser.", pt: "Este perfil não está mais salvo neste navegador." },
  "No pudimos comprobar los datos guardados en este navegador.": { en: "We couldn't verify the saved data in this browser.", pt: "Não foi possível verificar os dados salvos neste navegador." },
  "Los datos cambiaron en otra pestaña. Recarga antes de continuar.": { en: "The data changed in another tab. Refresh before continuing.", pt: "Os dados mudaram em outra aba. Atualize antes de continuar." },
  "Los datos nuevos no tienen un formato válido.": { en: "The new data has an invalid format.", pt: "Os novos dados estão em um formato inválido." },
  "Descarga o reemplaza explícitamente el registro dañado antes de guardar.": { en: "Download or explicitly replace the damaged record before saving.", pt: "Baixe ou substitua explicitamente o registro danificado antes de salvar." },
  "No pudimos guardar los datos en este navegador. Revisa el espacio disponible y vuelve a intentarlo.": { en: "We couldn't save the data in this browser. Check the available space and try again.", pt: "Não foi possível salvar os dados neste navegador. Confira o espaço disponível e tente novamente." },
  "No hay un registro dañado que reemplazar.": { en: "There is no damaged record to replace.", pt: "Não há registro danificado para substituir." },
  "Los datos no tienen un formato válido para la copia.": { en: "The data has an invalid format for the backup.", pt: "Os dados estão em um formato inválido para a cópia de segurança." },
  "El registro de transacciones no coincide con los perfiles guardados.": { en: "The transaction record does not match the saved profiles.", pt: "O registro de transações não corresponde aos perfis salvos." },
  "La copia excede el tamaño admitido.": { en: "The backup exceeds the supported size.", pt: "A cópia de segurança excede o tamanho permitido." },
  "Esta copia es demasiado grande.": { en: "This backup is too large.", pt: "Esta cópia de segurança é grande demais." },
  "La copia no tiene un formato válido.": { en: "The backup has an invalid format.", pt: "A cópia de segurança está em um formato inválido." },
  "Esta copia no es compatible con Brote.": { en: "This backup is not compatible with Brote.", pt: "Esta cópia de segurança não é compatível com a Brote." },
  "Esta copia pertenece a otra red Solana. Abre Brote en la red de la copia para restaurarla.": { en: "This backup belongs to a different Solana network. Open Brote on the backup's network to restore it.", pt: "Esta cópia de segurança pertence a outra rede Solana. Abra a Brote na rede da cópia para restaurá-la." },
  "Una transacción firmada no corresponde a la cuenta del perfil indicada en la copia.": { en: "A signed transaction does not match the profile account listed in the backup.", pt: "Uma transação assinada não corresponde à conta do perfil indicada na cópia de segurança." },
  "Una transacción firmada usa una semilla distinta a la del perfil indicado en la copia.": { en: "A signed transaction uses a seed that differs from the profile listed in the backup.", pt: "Uma transação assinada usa uma semente diferente da do perfil indicado na cópia de segurança." },
  "Las transacciones de la copia no coinciden con sus perfiles.": { en: "The backup transactions do not match its profiles.", pt: "As transações da cópia de segurança não correspondem aos perfis." },
  "La copia debe conservar los perfiles y responsables de las firmas pendientes de este navegador.": { en: "The backup must keep the profiles and guardians for this browser's pending signatures.", pt: "A cópia de segurança deve manter os perfis e responsáveis pelas assinaturas pendentes deste navegador." },
  "Este navegador no permite coordinar pestañas con Web Locks. Abre Brote en un navegador compatible para guardar cambios.": { en: "This browser cannot coordinate tabs with Web Locks. Open Brote in a compatible browser to save changes.", pt: "Este navegador não permite coordenar abas com Web Locks. Abra a Brote em um navegador compatível para salvar alterações." },
  "No pudimos guardar los datos iniciales.": { en: "We couldn't save the initial data.", pt: "Não foi possível salvar os dados iniciais." },
  "Los datos cambiaron fuera de esta pestaña. Recarga antes de continuar.": { en: "The data changed outside this tab. Refresh before continuing.", pt: "Os dados mudaram fora desta aba. Atualize antes de continuar." },
  "Otra pestaña de Brote está editando estos datos. Esta pestaña se actualizará y podrá editar cuando la otra se cierre.": { en: "Another Brote tab is editing this data. This tab will refresh and can edit when the other tab closes.", pt: "Outra aba da Brote está editando estes dados. Esta aba será atualizada e poderá editar quando a outra for fechada." },
  "No pudimos obtener acceso exclusivo a los datos de este navegador.": { en: "We couldn't get exclusive access to this browser's data.", pt: "Não foi possível obter acesso exclusivo aos dados deste navegador." },
  "Esta pestaña está en modo lectura. Cierra la otra pestaña de Brote o recarga antes de editar.": { en: "This tab is read-only. Close the other Brote tab or refresh before editing.", pt: "Esta aba está em modo de leitura. Feche a outra aba da Brote ou atualize antes de editar." },
  "Este perfil ya no existe.": { en: "This profile no longer exists.", pt: "Este perfil não existe mais." },
  "Este espacio necesita estar dentro del proveedor de la aplicación.": { en: "This space must be inside the application provider.", pt: "Este espaço precisa estar dentro do provedor do aplicativo." },

  "Introduce un monto de SOL válido, con hasta 9 decimales.": { en: "Enter a valid SOL amount with up to 9 decimal places.", pt: "Digite um valor válido em SOL, com até 9 casas decimais." },
  "El monto debe ser mayor que cero y estar dentro del límite permitido.": { en: "The amount must be greater than zero and within the allowed limit.", pt: "O valor deve ser maior que zero e estar dentro do limite permitido." },
  "La derivación de direcciones requiere HTTPS o localhost.": { en: "Address derivation requires HTTPS or localhost.", pt: "A derivação de endereços requer HTTPS ou localhost." },
  "La semilla excede 32 bytes.": { en: "The seed exceeds 32 bytes.", pt: "A semente excede 32 bytes." },
  "RPC rechazado: el clúster no es Solana mainnet ({genesis}).": { en: "RPC rejected: the cluster is not Solana mainnet ({genesis}).", pt: "RPC rejeitado: o cluster não é a Solana mainnet ({genesis})." },
  "RPC rechazado: el clúster no es Solana testnet ({genesis}).": { en: "RPC rejected: the cluster is not Solana testnet ({genesis}).", pt: "RPC rejeitado: o cluster não é a Solana testnet ({genesis})." },
  "VITE_SOLANA_NETWORK inválido: {value}. Usa mainnet o testnet.": { en: "Invalid VITE_SOLANA_NETWORK: {value}. Use mainnet or testnet.", pt: "VITE_SOLANA_NETWORK inválido: {value}. Use mainnet ou testnet." },
  "No se pudo leer el registro local de transacciones. Se bloquearon nuevas operaciones.": { en: "The local transaction record couldn't be read. New operations have been blocked.", pt: "Não foi possível ler o registro local de transações. Novas operações foram bloqueadas." },
  "El registro local de transacciones no se puede interpretar. Se bloquearon nuevas operaciones.": { en: "The local transaction record can't be interpreted. New operations have been blocked.", pt: "Não é possível interpretar o registro local de transações. Novas operações foram bloqueadas." },
  "La transacción firmada no tiene un formato válido.": { en: "The signed transaction has an invalid format.", pt: "A transação assinada está em um formato inválido." },
  "La copia contiene transacciones firmadas inválidas.": { en: "The backup contains invalid signed transactions.", pt: "A cópia de segurança contém transações assinadas inválidas." },
  "No se pudo guardar el registro de la transacción. Se conservará el resultado anterior; verifica la firma antes de operar de nuevo.": { en: "The transaction record couldn't be saved. The previous result will be kept; verify the signature before transacting again.", pt: "Não foi possível salvar o registro da transação. O resultado anterior será mantido; verifique a assinatura antes de operar novamente." },
  "Hay una transacción sin resultado definitivo. Verifica su estado antes de firmar otra operación.": { en: "A transaction has no final result. Check its status before signing another operation.", pt: "Há uma transação sem resultado definitivo. Verifique o status antes de assinar outra operação." },
  "El RPC no pudo estimar la comisión de esta transacción.": { en: "The RPC couldn't estimate this transaction's fee.", pt: "O RPC não conseguiu estimar a taxa desta transação." },
  "La firma ya pertenece a otra operación; no se envió.": { en: "The signature already belongs to another operation; it was not sent.", pt: "A assinatura já pertence a outra operação; ela não foi enviada." },
  "La sesión de la billetera cambió. Vuelve a conectar.": { en: "The wallet session changed. Connect again.", pt: "A sessão da wallet mudou. Conecte-se novamente." },
  "La sesión de la billetera cambió. No se envió la transacción.": { en: "The wallet session changed. The transaction was not sent.", pt: "A sessão da wallet mudou. A transação não foi enviada." },
  "La transacción fue firmada, pero el RPC no confirmó si se envió o ejecutó: {error}. Verifica el estado antes de reintentar.": { en: "The transaction was signed, but the RPC didn't confirm whether it was sent or executed: {error}. Check its status before trying again.", pt: "A transação foi assinada, mas o RPC não confirmou se foi enviada ou executada: {error}. Verifique o status antes de tentar novamente." },
  "La billetera devolvió una transacción distinta; no se envió.": { en: "The wallet returned a different transaction; it was not sent.", pt: "A wallet retornou uma transação diferente; ela não foi enviada." },
  "La billetera no firmó la transacción requerida; no se envió.": { en: "The wallet didn't sign the required transaction; it was not sent.", pt: "A wallet não assinou a transação solicitada; ela não foi enviada." },
  "El RPC devolvió una firma distinta a la transacción firmada.": { en: "The RPC returned a signature that differs from the signed transaction.", pt: "O RPC retornou uma assinatura diferente da transação assinada." },
  "La transacción falló: {error}. Firma: {signature}": { en: "The transaction failed: {error}. Signature: {signature}", pt: "A transação falhou: {error}. Assinatura: {signature}" },
  "La transacción firmada venció. Su resultado sigue sin resolverse; no se creó otra firma.": { en: "The signed transaction expired. Its result is still unresolved; no new signature was created.", pt: "A transação assinada expirou. O resultado ainda não foi resolvido; nenhuma nova assinatura foi criada." },
  "El RPC devolvió una firma distinta.": { en: "The RPC returned a different signature.", pt: "O RPC retornou uma assinatura diferente." },
  "La red confirmó que la transacción falló.": { en: "The network confirmed that the transaction failed.", pt: "A rede confirmou que a transação falhou." },
  "La red confirmó la transacción.": { en: "The network confirmed the transaction.", pt: "A rede confirmou a transação." },
  "El historial registra la transacción como fallida.": { en: "The history shows the transaction as failed.", pt: "O histórico registra a transação como falha." },
  "El historial registra la transacción como confirmada.": { en: "The history shows the transaction as confirmed.", pt: "O histórico registra a transação como confirmada." },
  "El bloque de validez venció, pero la ausencia en el historial reciente no demuestra que la transacción no se ejecutó. Sigue pendiente de verificación.": { en: "The validity block expired, but the transaction's absence from recent history doesn't prove it wasn't executed. Verification is still pending.", pt: "O bloco de validade expirou, mas a ausência no histórico recente não prova que a transação não foi executada. A verificação continua pendente." },
  "La firma aún no aparece confirmada. Puedes reenviar exactamente la misma transacción firmada.": { en: "The signature hasn't been confirmed yet. You can resend the exact same signed transaction.", pt: "A assinatura ainda não foi confirmada. Você pode reenviar exatamente a mesma transação assinada." },

  "No se encontró la extensión {name}. Instálala y recarga la página.": { en: "The {name} extension wasn't found. Install it and reload the page.", pt: "A extensão {name} não foi encontrada. Instale-a e recarregue a página." },
  "La billetera de prueba no está disponible.": { en: "The test wallet is unavailable.", pt: "A carteira de teste não está disponível." },
  "El RPC devolvió un saldo que no se puede representar con precisión.": { en: "The RPC returned a balance that can't be represented precisely.", pt: "O RPC retornou um saldo que não pode ser representado com precisão." },
  "Tiempo de espera del RPC agotado.": { en: "The RPC request timed out.", pt: "A solicitação RPC expirou." },
  "VITE_SOLANA_RPC_URL debe usar HTTPS.": { en: "VITE_SOLANA_RPC_URL must use HTTPS.", pt: "VITE_SOLANA_RPC_URL deve usar HTTPS." },
  "La conexión principal no está disponible. Seguimos conectados a Solana mainnet a través de PublicNode.": { en: "The primary connection is unavailable. We're still connected to Solana mainnet through PublicNode.", pt: "A conexão principal está indisponível. Continuamos conectados à Solana mainnet pelo PublicNode." },
  "No se pudo consultar mainnet. RPC oficial: {error}. PublicNode: {fallbackError}.": { en: "Couldn't query mainnet. Official RPC: {error}. PublicNode: {fallbackError}.", pt: "Não foi possível consultar a mainnet. RPC oficial: {error}. PublicNode: {fallbackError}." },
  "La billetera no devolvió una dirección pública.": { en: "The wallet didn't return a public address.", pt: "A wallet não retornou um endereço público." },
  "La cuenta activa de la extensión cambió. Vuelve a conectar.": { en: "The extension's active account changed. Connect again.", pt: "A conta ativa da extensão mudou. Conecte-se novamente." },
  "La conexión principal dejó de responder. Seguimos consultando Solana mainnet a través de PublicNode.": { en: "The primary connection stopped responding. We're continuing to query Solana mainnet through PublicNode.", pt: "A conexão principal parou de responder. Continuamos consultando a Solana mainnet pelo PublicNode." },
  "PublicNode no pudo completar la consulta: {error}": { en: "PublicNode couldn't complete the request: {error}", pt: "O PublicNode não conseguiu concluir a consulta: {error}" },
  "Conecta la billetera del representante para firmar.": { en: "Connect the guardian's wallet to sign.", pt: "Conecte a wallet da pessoa responsável para assinar." },
  "Espera a que termine la operación actual.": { en: "Wait for the current operation to finish.", pt: "Aguarde a operação atual terminar." },
  "Esta cuenta ya existe en mainnet. Actualiza el saldo.": { en: "This account already exists on mainnet. Refresh the balance.", pt: "Esta conta já existe na mainnet. Atualize o saldo." },
  "Esta cuenta ya existe en testnet. Actualiza el saldo.": { en: "This account already exists on testnet. Refresh the balance.", pt: "Esta conta já existe na testnet. Atualize o saldo." },
  "Saldo insuficiente en la billetera del representante para crear la cuenta y pagar la comisión.": { en: "The guardian's wallet has insufficient funds to create the account and pay the fee.", pt: "A wallet da pessoa responsável não tem saldo suficiente para criar a conta e pagar a taxa." },
  "La cuenta del perfil no existe o no es una cuenta de sistema válida.": { en: "The profile account doesn't exist or isn't a valid system account.", pt: "A conta do perfil não existe ou não é uma conta de sistema válida." },
  "Saldo insuficiente para el depósito y la comisión de red.": { en: "Insufficient funds for the deposit and network fee.", pt: "Saldo insuficiente para o depósito e a taxa de rede." },
  "La dirección de destino debe ser distinta de la cuenta del perfil.": { en: "The destination address must differ from the profile account.", pt: "O endereço de destino deve ser diferente da conta do perfil." },
  "Introduce una dirección de destino Solana válida.": { en: "Enter a valid Solana destination address.", pt: "Informe um endereço de destino Solana válido." },
  "Saldo insuficiente en la cuenta del perfil.": { en: "Insufficient funds in the profile account.", pt: "Saldo insuficiente na conta do perfil." },
  "El retiro debe dejar la cuenta vacía o conservar su saldo mínimo de rent-exemption.": { en: "The withdrawal must leave the account empty or preserve its rent-exempt minimum balance.", pt: "O saque deve deixar a conta vazia ou manter seu saldo mínimo de isenção de aluguel." },
  "El retiro es demasiado pequeño para que la cuenta de destino alcance el saldo mínimo exento de renta.": { en: "The withdrawal is too small to bring the destination account to its rent-exempt minimum balance.", pt: "O saque é pequeno demais para que a conta de destino atinja o saldo mínimo de isenção de aluguel." },
  "El representante necesita SOL para la comisión de red.": { en: "The guardian needs SOL to pay the network fee.", pt: "A pessoa responsável precisa de SOL para pagar a taxa de rede." },
  "Operación cancelada.": { en: "Operation cancelled.", pt: "Operação cancelada." },
  "No se encontró la transacción firmada.": { en: "The signed transaction could not be found.", pt: "A transação assinada não foi encontrada." },
  "La transacción ya no está pendiente.": { en: "The transaction is no longer pending.", pt: "A transação não está mais pendente." },
  "Conecta la billetera del representante que firmó esta transacción.": { en: "Connect the guardian's wallet that signed this transaction.", pt: "Conecte a wallet da pessoa responsável que assinou esta transação." },
  "useSolana debe usarse dentro de SolanaProvider.": { en: "useSolana must be used inside SolanaProvider.", pt: "useSolana deve ser usado dentro de SolanaProvider." },
  "{count} transacción(es) sin detalle de saldo en este RPC.": { en: "{count} transaction(s) have no balance details from this RPC.", pt: "{count} transação(ões) sem detalhes de saldo neste RPC." },

  [`SOLANA MAINNET · SOL real

Crear cuenta para {name}
Dirección: {address}
Desde: {guardian}
Depósito inicial: {amount} SOL, más comisión de red.

La billetera del representante deberá firmar. ¿Continuar?`]: {
    en: `SOLANA MAINNET · Real SOL

Create account for {name}
Address: {address}
From: {guardian}
Initial deposit: {amount} SOL, plus network fee.

The guardian's wallet will need to sign. Continue?`,
    pt: `SOLANA MAINNET · SOL real

Criar conta para {name}
Endereço: {address}
De: {guardian}
Depósito inicial: {amount} SOL, mais taxa de rede.

A wallet da pessoa responsável precisará assinar. Continuar?`,
  },
  [`SOLANA MAINNET · SOL real

Depositar {amount} SOL para {name}
Desde: {guardian}
Hacia: {address}
Más comisión de red pagada por el representante.

¿Continuar a la firma en tu billetera?`]: {
    en: `SOLANA MAINNET · Real SOL

Deposit {amount} SOL for {name}
From: {guardian}
To: {address}
Plus network fee paid by the guardian.

Continue to wallet signing?`,
    pt: `SOLANA MAINNET · SOL real

Depositar {amount} SOL para {name}
De: {guardian}
Para: {address}
Mais a taxa de rede paga pela pessoa responsável.

Continuar para a assinatura na sua wallet?`,
  },
  [`SOLANA MAINNET · SOL real

Retirar {amount} SOL de {name}
Desde: {address}
Hacia: {destination}
Firma: {guardian}
La comisión se paga desde la billetera del representante.

Verifica cuidadosamente el destino. ¿Continuar?`]: {
    en: `SOLANA MAINNET · Real SOL

Withdraw {amount} SOL from {name}
From: {address}
To: {destination}
Signer: {guardian}
The fee is paid from the guardian's wallet.

Check the destination carefully. Continue?`,
    pt: `SOLANA MAINNET · SOL real

Sacar {amount} SOL de {name}
De: {address}
Para: {destination}
Assinatura: {guardian}
A taxa é paga pela wallet da pessoa responsável.

Confira o destino com atenção. Continuar?`,
  },
  [`SOLANA TESTNET · SOL de prueba sin valor monetario

Crear cuenta para {name}
Dirección: {address}
Desde: {guardian}
Depósito inicial: {amount} SOL de prueba, más comisión de red.

La billetera del representante deberá firmar. ¿Continuar?`]: {
    en: `SOLANA TESTNET · Test SOL has no monetary value

Create account for {name}
Address: {address}
From: {guardian}
Initial deposit: {amount} test SOL, plus network fee.

The guardian's wallet will need to sign. Continue?`,
    pt: `SOLANA TESTNET · SOL de teste não tem valor monetário

Criar conta para {name}
Endereço: {address}
De: {guardian}
Depósito inicial: {amount} SOL de teste, mais taxa de rede.

A wallet da pessoa responsável precisará assinar. Continuar?`,
  },
  [`SOLANA TESTNET · SOL de prueba sin valor monetario

Depositar {amount} SOL de prueba para {name}
Desde: {guardian}
Hacia: {address}
Más comisión de red pagada por el representante.

¿Continuar a la firma en tu billetera?`]: {
    en: `SOLANA TESTNET · Test SOL has no monetary value

Deposit {amount} test SOL for {name}
From: {guardian}
To: {address}
Plus network fee paid by the guardian.

Continue to wallet signing?`,
    pt: `SOLANA TESTNET · SOL de teste não tem valor monetário

Depositar {amount} SOL de teste para {name}
De: {guardian}
Para: {address}
Mais a taxa de rede paga pela pessoa responsável.

Continuar para a assinatura na sua wallet?`,
  },
  [`SOLANA TESTNET · SOL de prueba sin valor monetario

Retirar {amount} SOL de prueba de {name}
Desde: {address}
Hacia: {destination}
Firma: {guardian}
La comisión se paga desde la billetera del representante.

Verifica cuidadosamente el destino. ¿Continuar?`]: {
    en: `SOLANA TESTNET · Test SOL has no monetary value

Withdraw {amount} test SOL from {name}
From: {address}
To: {destination}
Signer: {guardian}
The fee is paid from the guardian's wallet.

Check the destination carefully. Continue?`,
    pt: `SOLANA TESTNET · SOL de teste não tem valor monetário

Sacar {amount} SOL de teste de {name}
De: {address}
Para: {destination}
Assinatura: {guardian}
A taxa é paga pela wallet da pessoa responsável.

Confira o destino com atenção. Continuar?`,
  },
};
