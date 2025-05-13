import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

//latitude longitude 기기 좌표로 자동 입력 or 주소 선택
//naver api 연결
//위치정보 동의

import * as Location from "expo-location";

type Appointment = {
  id: string;
  title: string;
  location: string;
  time: string;
  shareOffset: string;
};

const STORAGE_KEY = "appointments";

const AppointmentScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // setErrorMsg("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      const latitude = currentLocation.coords.latitude;
      const longitude = currentLocation.coords.longitude;
      console.log("latitude:", latitude, "longitude:", longitude);
    }

    getCurrentLocation();
  }, []);

  // Form states
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [shareOffset, setShareOffset] = useState("30");

  const shareOffsetOptions = Array.from({ length: 5 }, (_, i) => (i + 1) * 30);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setAppointments(JSON.parse(stored));
        }
      } catch (error) {
        console.error("불러오기 실패", error);
      }
    };
    loadAppointments();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !location.trim() || !time.trim()) {
      Alert.alert("입력 오류", "약속 이름, 장소, 시간은 필수입니다.");
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title,
      location,
      time,
      shareOffset,
    };

    const updated = [...appointments, newAppointment];

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setAppointments(updated);
      setTitle("");
      setLocation("");
      setTime("");
      setShareOffset("30");
      setModalVisible(false);
    } catch (error) {
      console.error("저장 실패", error);
      Alert.alert("에러", "저장 중 문제가 발생했습니다.");
    }
  };

  const deleteAppointment = (id: string) => {
    Alert.alert(
      "삭제 확인",
      "정말로 이 약속을 삭제하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "확인",
          onPress: async () => {
            const filtered = appointments.filter((a) => a.id !== id);
            try {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
              setAppointments(filtered);
            } catch (error) {
              console.error("삭제 실패", error);
              Alert.alert("삭제 실패", "삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>내 약속</Text>
      <Button title="＋ 약속 추가" onPress={() => setModalVisible(true)} />
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>{item.title}</Text>
            <Text>장소: {item.location}</Text>
            <Text>출발 장소: {item.location}</Text>
            <Text>시간: {item.time}</Text>
            <Text>공유 시작 전: {item.shareOffset}분</Text>
            <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.label}>약속 이름 *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="약속 이름을 입력하세요"
          />

          <Text style={styles.label}>장소 *</Text>

          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="장소를 입력하세요"
          />

          <Text style={styles.label}>시간 *</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="시간을 입력하세요"
          />

          <Text style={styles.label}>공유 시작 전 시간</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={shareOffset}
              onValueChange={(itemValue) => setShareOffset(itemValue)}
              style={{
                height: Platform.OS === "ios" ? 180 : 50,
              }}
            >
              {shareOffsetOptions.map((minutes) => (
                <Picker.Item
                  key={minutes}
                  label={`${minutes}분`}
                  value={String(minutes)}
                />
              ))}
            </Picker>
          </View>

          <View style={{ marginTop: 20 }}>
            <Button title="저장" onPress={handleCreate} />
            <View style={{ height: 10 }} />
            <Button
              title="닫기"
              color="gray"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AppointmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  preview: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  previewTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  deleteText: {
    marginTop: 10,
    color: "red",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  label: {
    marginTop: 10,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginTop: 5,
  },
});
