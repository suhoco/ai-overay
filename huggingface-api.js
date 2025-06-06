const axios = require('axios');
const HUGGINGFACE_API_TOKEN = '개인정보';
const MODEL_ENDPOINT = 'https://api-inference.huggingface.co/models/ButterflAI/game-optimize';

async function queryHuggingFaceAPI(inputText, persona = "") {
    const formattedPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>${persona}<|eot_id|><|start_header_id|>user<|end_header_id|>${inputText}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
    const response = await axios.post(
        MODEL_ENDPOINT,
        { inputs: formattedPrompt, parameters: { max_new_tokens: 200 } },
        { headers: { Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}` } }
    );
    const result = response.data;
    return result[0]?.generated_text?.replace(formattedPrompt, '') || '응답 오류';
}

module.exports = { queryHuggingFaceAPI };
