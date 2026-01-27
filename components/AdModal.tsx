
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface AdModalProps {
  isVisible: boolean;
  onAdComplete: () => void;
}

export default function AdModal({ isVisible, onAdComplete }: AdModalProps) {
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    if (!isVisible) {
      setTimer(10);
      return;
    }

    console.log('Ad started - 10 seconds countdown');

    const intervalId = setInterval(() => {
      setTimer((prevTimer) => {
        const newTimer = prevTimer - 1;
        console.log(`Ad timer: ${newTimer} seconds remaining`);
        
        if (newTimer === 0) {
          console.log('Ad completed!');
          clearInterval(intervalId);
          setTimeout(() => {
            onAdComplete();
          }, 100);
        }
        
        return newTimer;
      });
    }, 1000);

    return () => {
      console.log('Ad modal cleanup');
      clearInterval(intervalId);
    };
  }, [isVisible, onAdComplete]);

  const timerText = `${timer}`;
  const messageText = timer > 0 
    ? 'Please wait while we show you this ad...' 
    : 'Ad complete! Proceeding...';

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        console.log('Ad modal close requested (blocked until complete)');
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="play.rectangle.fill"
              android_material_icon_name="play-circle-filled"
              size={64}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>Advertisement</Text>
          <Text style={styles.message}>{messageText}</Text>

          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <>
                <Text style={styles.timerNumber}>{timerText}</Text>
                <Text style={styles.timerLabel}>seconds</Text>
              </>
            ) : (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
          </View>

          {timer > 0 && (
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${((10 - timer) / 10) * 100}%` }
                ]} 
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 80,
    justifyContent: 'center',
  },
  timerNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 72,
  },
  timerLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});
