const vscode = require('vscode');
const makerjs = require('makerjs');
const cheerio = require('cheerio');

var nodepath = require('path');
const fs = require('fs');

const JSONFANCY = function (x) { return require('util').inspect(x, { colors: false, depth: null, breakLength: 1 }); };
const DT = function () { return new Date().toISOString().substr(0, 19).replace('T', '|'); }

//

let GetSVG = function (filepath) {
    let svg = 0;
    delete require.cache[filepath];
    const drawlib = require(filepath);
    let drawing = {};
    let drawarg = []; for (let x of drawlib.metaParameters) { drawarg.push(x.value); }
    drawlib.apply(drawing, drawarg);
    svg = makerjs.exporter.toSVG(drawing, {
        strokeWidth: 2, stroke: '#ffffff', fill: 'black', cssStyle: 'fillOpacity:1',
        svgAttrs: { width: '90%', height: '90%' }
    });
    return svg;
}

//

const XT = require('@cogsmith/xt').Init();
const App = XT.App; let LOG = console.log;

if (0) {
    App.InitLog = function () {
        let LOGCHANNEL = vscode.window.createOutputChannel('MAKERJS');
        //LOGCHANNEL.show();

        let ADDONLOG = function (msg) {
            if (typeof (msg) == 'object') { msg = JSONFANCY(msg); }
            if (!msg) { msg = ""; }
            msg = '[' + DT() + '] ' + msg;
            LOGCHANNEL.appendLine(msg);
        }

        LOG = ADDONLOG;
    }
}

//

WATCHLIST = {};

GetHTML = function (filepath) {
    let svg = GetSVG(filepath);
    let ext = 'svg';
    let filebase = nodepath.basename(filepath).split('.')[0];
    if (filebase == filebase.toUpperCase()) { ext = 'SVG'; }
    fs.writeFileSync(nodepath.dirname(filepath) + '/' + filebase + '.' + ext, svg);

    let jq = cheerio.load(svg);
    //jq('SVG').attr({ height: '90%', width: '90%' });
    //jq('SVG').css({ stroke: '#ffffff' }); 
    //jq('*').css({ stroke: '#ffffff' }).attr({ stroke: '#ffffff' })
    //jq('*').each((x) => { jq(this).css({ stroke: '#ffffff' }).attr({ stroke: '#ffffff' }) });
    //LOG(jq.html());

    let table = "<div id='root'><center><table style='width:100%;height:100%'><tr><td align='center' valign='middle'>" + jq.html() + "<td></tr></table></center></div>";
    let html = "<html><head><style>center { height:100%; } #root, #root>div { width: 100%; height: 100%; } html,body { color:white;background-color:#3177C6;border:0px;margin:0px;padding:0px;width:100%;height:100% }</style></head><body><center>" + table + "</center></body></html>";
    return html;
}

App.Activate = function (workspace) {
    App.Workspace = workspace;

    //

    const MAKERJS_WATCH = vscode.commands.registerCommand('MAKERJS_WATCH', async (e) => {
        let filepath = e._fsPath;
        let html = GetHTML(filepath);

        LOG('WATCH: ' + filepath);

        let title = e.path.split('/').pop().split('.')[0] + '.SVG';
        let panel = vscode.window.createWebviewPanel('MAKERJS', title, vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = html;

        WATCHLIST[filepath] = panel;
    });
    App.Workspace.subscriptions.push(MAKERJS_WATCH);

    //

    App.Workspace.subscriptions.push(vscode.workspace.onDidSaveTextDocument(e => {
        let filepath = e.uri._fsPath;
        LOG('SAVE: ' + filepath);
        if (WATCHLIST[filepath]) { WATCHLIST[filepath].webview.html = GetHTML(filepath); }
    }))

    //

    App.Run();
}

App.Deactivate = function (workspace) {
    LOG('ADDON.Deactivate');
}

//

const activate = App.Activate;
const deactivate = App.Deactivate;
module.exports = { activate, deactivate };
