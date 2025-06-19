import React, { useState, useRef } from "react";
import { Box, Button, Typography, TextField, Divider, Avatar } from "@mui/material";

// CSV 변환 유틸 (간단 예시)
function toCSV(data: any[]) {
  if (!data.length) return "";
  const keys = Object.keys(data[0]);
  const rows = data.map(row => keys.map(k => row[k]).join(","));
  return [keys.join(","), ...rows].join("\n");
}
function fromCSV(csv: string) {
  const [header, ...lines] = csv.trim().split("\n");
  const keys = header.split(",");
  return lines.map(line => {
    const values = line.split(",");
    const obj: any = {};
    keys.forEach((k, i) => (obj[k] = values[i]));
    return obj;
  });
}

function SettingScreen() {
  // 프로필 사진
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const fileRef = useRef<HTMLInputElement>(null);

  // 닉네임
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "피출러");

  // 프로필 사진 업로드
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
        localStorage.setItem("avatar", reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // 프로필 사진 삭제
  const handleAvatarDelete = () => {
    setAvatar("");
    localStorage.removeItem("avatar");
  };

  // 닉네임 변경
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    localStorage.setItem("nickname", e.target.value);
  };

  // 연습 기록 백업 (CSV)
  const handleExport = () => {
    const records = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
    const csv = toCSV(records);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "practiceRecords.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 연습 기록 복원 (CSV)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const csv = reader.result as string;
        const data = fromCSV(csv);
        localStorage.setItem("practiceRecords", JSON.stringify(data));
        alert("연습 기록 복원이 완료되었습니다.");
      };
      reader.readAsText(file);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        설정
      </Typography>

      {/* 프로필 사진 */}
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        프로필 사진
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar src={avatar} sx={{ width: 64, height: 64, mr: 2 }} />
        <Button variant="outlined" onClick={() => fileRef.current?.click()}>
          {avatar ? "변경" : "등록"}
        </Button>
        {avatar && (
          <Button variant="text" color="error" onClick={handleAvatarDelete} sx={{ ml: 1 }}>
            삭제
          </Button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
      </Box>

      {/* 닉네임 */}
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        닉네임
      </Typography>
      <TextField
        label="닉네임"
        value={nickname}
        onChange={handleNicknameChange}
        size="small"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* 백업/복원 */}
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        백업/복원
      </Typography>
      <Button variant="outlined" onClick={handleExport} sx={{ mr: 2, mb: 1 }}>
        연습 기록 내보내기(CSV)
      </Button>
      <Button variant="outlined" component="label" sx={{ mb: 1 }}>
        연습 기록 가져오기(CSV)
        <input type="file" accept=".csv" hidden onChange={handleImport} />
      </Button>
      <Typography variant="body2" sx={{ color: "#888", mt: 1 }}>
        기기 변경 시 CSV로 백업/복원 가능합니다.
      </Typography>
    </Box>
  );
}

export default SettingScreen;
