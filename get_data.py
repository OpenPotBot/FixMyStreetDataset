from three import Three
from rake_nltk import Rake
import requests
import urllib
from urllib.request import urlretrieve
from urllib.parse import urlparse
import os

FMS_BASE_URL = "https://www.fixmystreet.com/open311/v2/"
FMS_BASE_PARAMETERS = {
    "jurisdiction_id": "fixmystreet",
}
DATA_FOLDER = "data"

CATEGORIES = [
    "Abandoned vehicles",
    "Bus stops",
    "Car parking",
    "Dog fouling",
    "Dumped rubbish",
    "Flyposting",
    "Flytipping",
    "Graffiti",
    "Parks/landscapes",
    "Pavements/footpaths",
    "Potholes",
    "Public toilets",
    "Roads/highways",
    "Road traffic signs",
    "Rubbish (refuse and recycling)",
    "Street cleaning",
    "Street lighting",
    "Street nameplates",
    "Traffic lights",
    "Trees",
]


class FMS(Three):
    def __init__(self):
        super(FMS, self).__init__()
        self.endpoint = FMS_BASE_URL
        self.format = "xml"
        self.jurisdiction = FMS_BASE_PARAMETERS['jurisdiction_id']


def make_a_category_folder(category):
    folder_path = os.path.join(DATA_FOLDER, category)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)


def setup_folders():
    """ Initialise the folder structure for training if it doesn't exist"""
    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)
    for cat in CATEGORIES:
        make_a_category_folder(cat)


def extract_labels(text_list):
    """Takes a list of strings, extracts significant words and returns them
    as a list of labels for use in the model. We make use of the RAKE Algorithm.
    There may be value in running the operation across a whole dataset of reports
    and then ranking the phrases and using those rankings to select significant
    labels from the user supplied text. We also may need to reduce this dataset
    across all labels to remove the phrases that don't occur across multiple
    reports, for example placenames, etc, as this may create bias in our model.
    """
    label_list = []
    r = Rake()
    corpus = " ".join(text_list)
    r.extract_keywords_from_text(corpus)
    label_list = r.get_ranked_phrases()
    return label_list


def grab_report_data(report):
    """ Given an single XML entry representing a single FMS report,
    grab the metadata and attached photo(s) placing in the correct folder
    to build the dataset for training."""
    if 'media_url' in report.keys():
        labels = extract_labels([report['detail'],
                                report['title'],
                                report['description']])
        web_path = urlparse(report['media_url'])
        file_name = os.path.split(web_path.path)[1]
        img_file_path = os.path.join(DATA_FOLDER,
                                     report['service_code'],
                                     file_name)
        print(report['service_code'])
        try:
            urlretrieve(report['media_url'], img_file_path)
        except FileNotFoundError as e:
            print("New service code found, because we're special")
            make_a_category_folder(report['service_code'])
            urlretrieve(report['media_url'], img_file_path)

        label_file_name = file_name.rsplit('.', maxsplit=1)[0]
        labels_file_path = os.path.join(DATA_FOLDER,
                                        report['service_code'],
                                        label_file_name)
        print(labels_file_path)
        with open(labels_file_path, 'w') as file_handler:
            file_handler.write("{}\n".format(labels))


def main():
    setup_folders()
    fms_client = FMS()
    for report in fms_client.requests()['request']:
        grab_report_data(report)


if __name__ == '__main__':
    main()
