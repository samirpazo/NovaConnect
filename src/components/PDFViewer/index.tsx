import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface PDFViewerProps {
  uri?: string;
  pdfBase64?: string;
}

export default function PDFViewer({ uri, pdfBase64 }: PDFViewerProps) {
  if (Platform.OS === 'web') {
    return (
      <iframe
        src={uri}
        title="PDF Viewer"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    );
  }

  if (pdfBase64) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.min.js"></script>
        <style>
          body { 
            margin: 0; 
            padding: 8px; 
            background-color: #121212; 
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          #pdf-container { 
            width: 100%; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
          }
          canvas { 
            width: 100% !important; 
            height: auto !important; 
            margin-bottom: 10px; 
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
          }
          .loader {
            color: #a1a1aa;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            margin-top: 50px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div id="loader" class="loader">Cargando documento...</div>
        <div id="pdf-container"></div>
        <script>
          try {
            var pdfData = atob('${pdfBase64}');
            var pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';

            var loadingTask = pdfjsLib.getDocument({data: pdfData});
            loadingTask.promise.then(function(pdf) {
              var loader = document.getElementById('loader');
              if (loader) loader.style.display = 'none';
              var container = document.getElementById('pdf-container');
              
              var renderPage = function(pageNum) {
                if (pageNum > pdf.numPages) return;
                
                pdf.getPage(pageNum).then(function(page) {
                  var viewport = page.getViewport({scale: 2.0});
                  var canvas = document.createElement('canvas');
                  var context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  container.appendChild(canvas);

                  var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                  };
                  page.render(renderContext).promise.then(function() {
                    renderPage(pageNum + 1);
                  });
                });
              };
              
              renderPage(1);
            }, function (reason) {
              document.getElementById('loader').innerText = 'Error al cargar PDF: ' + reason.message;
            });
          } catch (e) {
            document.getElementById('loader').innerText = 'Error crítico: ' + e.message;
          }
        </script>
      </body>
      </html>
    `;

    return (
      <View style={styles.container}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          bounces={false}
          scalesPageToFit={true}
        />
      </View>
    );
  }

  if (!uri) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
