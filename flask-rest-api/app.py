from flask import Flask, request
from flask_cors import CORS
from flask_restful import Api, Resource, fields, marshal_with
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)
api = Api(app)
db = SQLAlchemy(app)

ENV = 'prod'

if ENV == 'dev':
    app.debug=True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost/notes'
else:
    app.debug=False
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://pghfssinatzcyh:5c9eaee763415a5c427d42716ac90bec76900eed9b9e37c8a76d93e3ee01aef9@ec2-3-222-74-92.compute-1.amazonaws.com:5432/d4v0upfir3mrc2'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

resource_fields = {
    'chrome_identity_id': fields.String,
    "video_id": fields.String,
    "note": fields.String,
    "timestamp": fields.Float,
}

class NoteModel(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    chrome_identity_id = db.Column(db.String(50), nullable=False)
    video_id = db.Column(db.String(50), nullable=False)
    note = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Float, nullable=False)

class Notes(Resource): #inherit from Resource
    @marshal_with(resource_fields)
    def get(self): #get request
        args = request.args
        chromeIdentity = args.get('chrome_identity_id')
        videoId = args.get('video_id')

        if not chromeIdentity or not videoId:
            return "Missing a parameter", 400

        result = NoteModel.query.filter_by(chrome_identity_id=chromeIdentity,video_id=videoId).order_by(NoteModel.timestamp).all()
        return result

    @marshal_with(resource_fields)
    def put(self):
        args = request.args
        chromeIdentity = args.get('chrome_identity_id')
        videoId = args.get('video_id')
        userNote = args.get('note')
        timeStamp = args.get('timestamp')

        if not chromeIdentity or not videoId or not userNote or not timeStamp:
            return "Missing a parameter", 400

        try:
            note = NoteModel(chrome_identity_id=chromeIdentity, video_id=videoId, note=userNote, timestamp=float(timeStamp))
            db.session.add(note)
            db.session.commit()
            return note
        except ValueError:
            return "In valid timestamp", 400

    def patch(self):
        args = request.args
        chromeIdentity = args.get('chrome_identity_id')
        videoId = args.get('video_id')
        userNote = args.get('note')
        timeStamp = args.get('timestamp')

        if not chromeIdentity or not videoId or not userNote or not timeStamp:
            return "Missing a parameter", 400

        try:
            result = NoteModel.query.filter_by(chrome_identity_id=chromeIdentity,video_id=videoId,timestamp=float(timeStamp)).first()
        except ValueError:
            return "In valid timestamp", 400

        if not result:
            return "Note not found", 400

        result.note = userNote

        db.session.commit()
        return 201
    
    def delete(self):
        args = request.args
        chromeIdentity = args.get('chrome_identity_id')
        videoId = args.get('video_id')
        timeStamp = args.get('timestamp')

        if not chromeIdentity or not videoId or not timeStamp:
            return "Missing a parameter", 400

        try:
            result = NoteModel.query.filter_by(chrome_identity_id=chromeIdentity,video_id=videoId,timestamp=float(timeStamp)).first()
        except ValueError:
            return "In valid timestamp", 400

        if not result:
           return "Note not found", 400

        db.session.delete(result)
        db.session.commit()
        return 201

# class, endpoint
api.add_resource(Notes, "/")

if __name__ == "__main__":
    app.run() #get rid of in prod env