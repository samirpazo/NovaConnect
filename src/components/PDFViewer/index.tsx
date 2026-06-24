import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface PDFViewerProps {
  uri: string;
}

export default function PDFViewer({ uri }: PDFViewerProps) {
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
