from flask import Flask, request
from flask_cors import CORS
from flask_restful import Api, Resource, fields, marshal_with
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)
api = Api(app)
db = SQLAlchemy(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'

resource_fields = {
    'chrome_identity_id': fields.String,
    "video_id": fields.String,
    "note": fields.String,
    "timestamp": fields.Float,
}

class NoteModel(db.Model):
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

        note = NoteModel(chrome_identity_id=chromeIdentity, video_id=videoId, note=userNote, timestamp=float(timeStamp))
        db.session.add(note)
        db.session.commit()
        return note

    def patch(self):
        args = request.args
        chromeIdentity = args.get('chrome_identity_id')
        videoId = args.get('video_id')
        userNote = args.get('note')
        timeStamp = args.get('timestamp')

        if not chromeIdentity or not videoId or not userNote or not timeStamp:
            return "Missing a parameter", 400

        result = NoteModel.query.filter_by(chrome_identity_id=chromeIdentity,video_id=videoId,timestamp=float(timeStamp)).first()

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

        result = NoteModel.query.filter_by(chrome_identity_id=chromeIdentity,video_id=videoId,timestamp=float(timeStamp)).first()

        if not result:
           return "Note not found", 400

        db.session.delete(result)
        db.session.commit()
        return 201

# class, endpoint
api.add_resource(Notes, "/")

if __name__ == "__main__":
    app.run(debug=True) #get rid of in prod env