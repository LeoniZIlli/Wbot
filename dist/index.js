"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wa_automate_1 = require("@open-wa/wa-automate");
const database_1 = __importDefault(require("./models/database"));
class App {
    constructor() {
        this.express = (0, express_1.default)();
        this.whatsBot();
    }
    whatsBot() {
        const launchConfig = {
            useChrome: true,
            autoRefresh: true,
            cacheEnabled: false,
            sessionId: 'hr'
        };
        (0, wa_automate_1.create)(launchConfig).then((client) => this.start(client));
    }
    start(client) {
        function formatMessage(result, allWorkingOk, affects, notAffects, withObservation) {
            if (allWorkingOk) {
                return `${result} ✅`;
            }
            else {
                let message = `${result} ⚠️`;
                if (affects.length !== 0) {
                    for (let i = 0; i < affects.length; i = i + 2) {
                        message += `\n\t🔴 ${affects[i + 1]}`;
                    }
                    message += "\n\t\t" + `${affects.length <= 2 ? ' **Afeta o negócio!**\n' : ' **Afetam o negócio!**\n'}`;
                }
                if (notAffects.length !== 0) {
                    for (let i = 0; i < notAffects.length; i = i + 2) {
                        message += `\n\t🟠 ${notAffects[i + 1]}`;
                    }
                    message += "\n\t\t" + `${notAffects.length <= 2 ? ' **Não afeta o negócio.**' : ' **Não afetam o negócio.**'}`;
                }
                if (withObservation.length !== 0) {
                    for (let i = 0; i < withObservation.length; i = i + 2) {
                        message += `\n\t🟡 ${withObservation[i + 1]}`;
                    }
                    message += "\n\t\t" + `${withObservation.length <= 2 ? ' **Funcionando com observação.**' : ' **Funcionando com obeservações.**'}`;
                }
                return message;
            }
        }
        client.onMessage(async (message) => {
            console.log(`Mensagem recebida do número ${message.from}`);
            if (['!RS', '!P'].includes(message.body.toUpperCase())) {
                try {
                    let date = await database_1.default.getDate('general_checklist');
                    let mens = '';
                    let aux = await database_1.default.readDailyReport('general_checklist', 2, 33, 'gc_id');
                    mens = formatMessage('    *•Aplicações (BlazeMeter, Zabbix, Outros)📱- STATUS:*', aux.allWorkingOk, aux.affects, aux.notAffects, aux.withObservation);
                    aux = await database_1.default.readDailyReport('general_checklist', 34, 43, 'gc_id');
                    mens += '\n\n' + formatMessage('    *•Conectividade (Firewall, Links Campus) 📡 - STATUS:*', aux.allWorkingOk, aux.affects, aux.notAffects, aux.withObservation);
                    aux = await database_1.default.readDailyReport('datacenter_checklist', 2, 19, 'dc_id');
                    mens += '\n\n' + formatMessage('    *•Datacenter (Firewall, Gerador, Links, Nobreaks, SMH, Storage, Switchs) 💾 - STATUS:*', aux.allWorkingOk, aux.affects, aux.notAffects, aux.withObservation);
                    if (message.body.toUpperCase() === '!P') {
                        await client.sendText(message.from, '*Report Diário do Relatório de Serviços TI Unicesumar (' + date[0].gc_date + ')📋:* \n\n' + mens);
                    }
                    if (message.body.toUpperCase() === '!RS') {
                        await client.sendText('554491373732-1614010500@g.us', '*Report Diário do Relatório de Serviços TI Unicesumar (' + date[0].gc_date + ')📋:* \n\n' + mens);
                    }
                }
                catch (err) {
                    console.log(err);
                }
            }
            if (message.body.toUpperCase() === '!HELP') {
                await client.sendText(message.from, 'Aqui está a lista de comandos disponíveis: \n !rs - Último report diário realizado. \n !p - Demonstração do sistema com problemas');
            }
        });
    }
}
exports.default = new App().express;
