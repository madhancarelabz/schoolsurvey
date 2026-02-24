const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { pool } = require('../server');
const auth = require('../middleware/auth');
const { uploadAudio } = require('../utils/storage');

const upload = multer({ dest: 'uploads/' });

/**
 * @route   POST /api/voice/turn
 * @desc    Process voice turn (Upload -> Convert -> STT -> R2)
 * @access  Private (JWT)
 */
router.post('/turn', auth, upload.single('audio'), async (req, res) => {
    const { session_id, employee_id } = req.user;

    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}.wav`;

    try {
        // 1. Requirement 64: Audio Conversion (16kHz Mono WAV)
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('wav')
                .audioChannels(1)
                .audioFrequency(16000)
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        const audioBuffer = fs.readFileSync(outputPath);

        // 2. Requirement 70: Metadata Generation (Duration & SHA256)
        const sha256_hash = crypto.createHash('sha256').update(audioBuffer).digest('hex');

        // Get duration using ffprobe
        const durationSeconds = await new Promise((resolve) => {
            ffmpeg.ffprobe(outputPath, (err, metadata) => {
                resolve(metadata ? metadata.format.duration : 0);
            });
        });

        // 3. Requirement 62: Sarvam STT (Malayalam)
        const sttResponse = await axios.post('https://api.sarvam.ai/speech-to-text', audioBuffer, {
            headers: {
                'api-subscription-key': process.env.SARVAM_API_KEY,
                'Content-Type': 'audio/wav'
            }
        });

        const transcript = sttResponse.data.transcript;

        // 4. Requirement 68: Cloudflare R2 Storage backup
        const filename = `${session_id}_${Date.now()}.wav`;
        const uploadResult = await uploadAudio(audioBuffer, filename);

        // 5. Requirement 70: Log Audio Metadata to DB
        // First find or create the response record (handled by n8n later, but we log the asset link)
        await pool.query(
            `INSERT INTO audio_assets (session_id, employee_id, storage_url, duration_seconds, sha256_hash, asset_type) 
             VALUES ($1, $2, $3, $4, $5, 'ANSWER')`,
            [session_id, employee_id, uploadResult.Location || filename, durationSeconds, sha256_hash]
        );

        // Cleanup temp files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.status(200).json({
            transcript,
            storage_url: uploadResult.Location || filename,
            duration: durationSeconds
        });

    } catch (err) {
        console.error('Voice Turn Error:', err);
        // Cleanup on error
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        res.status(500).json({ error: 'Voice processing failed' });
    }
});

/**
 * @route   POST /api/voice/tts
 * @desc    Generate Malayalam speech from text (Sarvam AI)
 * @access  Private (JWT)
 */
router.post('/tts', auth, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    try {
        // Requirement 66: Sarvam TTS Integration
        const response = await axios.post('https://api.sarvam.ai/text-to-speech', {
            inputs: [text],
            target_language_code: 'ml-IN',
            speaker: 'meera',
            model: 'bulbul:v1'
        }, {
            headers: {
                'api-subscription-key': process.env.SARVAM_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ audio_content: response.data.audios[0] });
    } catch (err) {
        console.error('TTS Error:', err);
        res.status(500).json({ error: 'Speech synthesis failed' });
    }
});

module.exports = router;
