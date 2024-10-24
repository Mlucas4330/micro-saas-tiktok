import express from 'express'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

const app = express()
const port = 3000
const url = 'http://localhost:' + port

app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage })

const options = {
    root: './public/pages'
}

app.get('/', (_req, res) => {
    res.sendFile('index.html', options)
})

app.post('/webm-to-mp4', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    const inputPath = req.file.path
    const outputPath = `uploads/canvas-recording.mp4`

    ffmpeg(inputPath)
        .setFfmpegPath(ffmpegPath)
        .output(outputPath)
        .videoCodec('libx264')
        .outputOptions([
            '-preset fast',
            '-crf 18',
            '-r 60',
            '-vf scale=1080:1920',
            '-c:a aac',
            '-b:a 192k',
            '-ac 2',
            '-ar 44100'
        ])
        .on('end', () => {
            res.setHeader('Content-Type', 'video/mp4')
            res.setHeader('Content-Disposition', 'attachment; filename="canvas-recording.mp4"')

            res.sendFile(path.resolve(outputPath), (err) => {
                if (err) {
                    console.error('Erro ao enviar o arquivo: ', err.message)
                    return res.status(500).send('Erro ao enviar o arquivo convertido.')
                }
                fs.unlink(inputPath, (err) => {
                    if (err) {
                        console.error('Erro ao remover o arquivo de entrada:', err.message)
                    } else {
                        console.log('Arquivos temporários de entrada removidos com sucesso.')
                    }
                })
                fs.unlink(outputPath, (err) => {
                    if (err) {
                        console.error('Erro ao remover o arquivo de saída:', err.message)
                    } else {
                        console.log('Arquivos temporários de saída removidos com sucesso.')
                    }
                });
            });
        })
        .on('error', (err) => {
            console.error('Erro na conversão: ', err.message)
            return res.status(500).send('Erro durante a conversão.')
        })
        .run()
})

app.use((_req, res) => {
    res.status(404).send('Rota não encontrada!');
});

app.listen(port, () => {
    console.log('Servidor Iniciado em: ', url)
})