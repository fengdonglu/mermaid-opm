import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeDiagnostics } from './features/diagnostics.js';
import { computeCompletion } from './features/completion.js';
import { computeHover } from './features/hover.js';
import { computeSymbols } from './features/symbols.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let diagnosticsEnabled = true;
let clientSupportsConfiguration = false;

async function readConfiguration(): Promise<void> {
  if (!clientSupportsConfiguration) return;
  try {
    const cfg = await connection.workspace.getConfiguration('opm');
    diagnosticsEnabled = cfg?.diagnostics?.enable ?? true;
  } catch {
    // keep the current cached value when the client cannot be queried
  }
}

function publishAll(): void {
  for (const doc of documents.all()) {
    connection.sendDiagnostics({ uri: doc.uri, diagnostics: computeDiagnostics(doc, diagnosticsEnabled) });
  }
}

documents.onDidChangeContent((change) => {
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics: computeDiagnostics(change.document, diagnosticsEnabled) });
});

connection.onInitialize((params) => {
  clientSupportsConfiguration = params.capabilities.workspace?.configuration === true;
  return {
    capabilities: {
      textDocumentSync: 1,
      completionProvider: { resolveProvider: false, triggerCharacters: [' ', '.'] },
      hoverProvider: true,
      documentSymbolProvider: true,
    },
  };
});

connection.onInitialized(async () => {
  await readConfiguration();
  connection.onDidChangeConfiguration(() => {
    void (async () => {
      await readConfiguration();
      publishAll();
    })();
  });
});

connection.onCompletion((p) => computeCompletion(documents.get(p.textDocument.uri)!));
connection.onCompletionResolve((item) => item);

connection.onHover((p) => computeHover(documents.get(p.textDocument.uri)!, p.position));

connection.onDocumentSymbol((p) => computeSymbols(documents.get(p.textDocument.uri)!));

documents.listen(connection);
connection.listen();
