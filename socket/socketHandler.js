/**
 * Deutschland QCM - Gestionnaire Socket.io
 * Temps réel : progression des élèves vue par le professeur
 */
module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log('Nouvelle connexion socket :', socket.id);

        // Le professeur rejoint la room "teachers" pour recevoir les évènements
        socket.on('join_teacher', () => {
            socket.join('teachers');
        });

        // Un élève commence un test (notification au professeur)
        socket.on('student_start', (data) => {
            io.to('teachers').emit('student_start', data);
        });

        // Un élève répond à une question (progression en temps réel)
        socket.on('student_progress', (data) => {
            io.to('teachers').emit('student_progress', data);
        });

        // Un élève a terminé (transmis aussi depuis le contrôleur POST)
        socket.on('student_finish', (data) => {
            io.to('teachers').emit('student_finish', data);
        });

        socket.on('disconnect', () => {
            io.to('teachers').emit('student_disconnect', { id: socket.id });
        });
    });
};
