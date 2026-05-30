import OpenAI from "openai";

export type OcrImageInput = {
  dataUrl: string;
  label: string;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Chưa cấu hình OPENAI_API_KEY.");
  }

  return new OpenAI({ apiKey });
}

export async function extractTextFromImages(images: OcrImageInput[]) {
  if (images.length === 0) {
    throw new Error("Không có hình ảnh để OCR.");
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    instructions: [
      "Bạn là hệ thống OCR cho báo cáo tài chính.",
      "Chỉ chép lại văn bản và số liệu nhìn thấy trong ảnh.",
      "Giữ nguyên thứ tự đọc theo từng trang.",
      "Không phân tích, không nhận định, không tính toán, không tự bổ sung số liệu.",
      "Nếu một vùng không đọc được, ghi [không đọc được].",
      "Trả về plain text tiếng Việt, không dùng Markdown.",
    ].join(" "),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `OCR ${images.length} ảnh báo cáo tài chính. Mỗi ảnh là một trang hoặc một file scan. Hãy chép lại text theo thứ tự ảnh.`,
          },
          ...images.flatMap((image) => [
            {
              type: "input_text" as const,
              text: `Bắt đầu ${image.label}`,
            },
            {
              type: "input_image" as const,
              image_url: image.dataUrl,
              detail: "high" as const,
            },
          ]),
        ],
      },
    ],
  });

  const outputText = response.output_text.trim();

  if (outputText.length < 20) {
    throw new Error("OCR không tìm thấy đủ text trong file.");
  }

  return outputText;
}
