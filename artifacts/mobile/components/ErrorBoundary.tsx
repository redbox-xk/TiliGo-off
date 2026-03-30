import React, { Component, PropsWithChildren } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Props = PropsWithChildren<{ onError?: (error: Error, stackTrace: string) => void }>;
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }): void { this.props.onError?.(error, info.componentStack); }
  resetError = (): void => { this.setState({ error: null }); };
  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Ndodhi një gabim</Text>
          <Text style={styles.msg}>{this.state.error.message}</Text>
          <Pressable style={styles.btn} onPress={this.resetError}>
            <Text style={styles.btnText}>Provo përsëri</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.background },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  msg: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
