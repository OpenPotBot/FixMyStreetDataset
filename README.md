# FixMyStreetDataSetCreator


## What does this do?

This script downloads a set of images and metadata about a service request received by FixMyStreet that has an image. The aim is to be able to build a training dataset for images of street related faults; enabling a ML model to have a high accuracy in classifing the type of a request without human interaction.

This is part of the wider PotBot project supported by the UK Local Government Association and delivered by Bath & North East Somerset Council and Wiltshire County Council.


## What is PotBot?

PotBot is an interactive bot for classifying and enriching street faults. It uses a convoluted neural network (CNN) to classify what a picture represents within a set of catagories as specified currently by FixMyStreet.A longer term aim is to make use of dashcam footage to detect, classify and submit street faults from council owned / operated vehicles.

## License

The code in this repo is released under a MIT license. 


## How to install

It is highly recommended that you make use of a virtualenv sandbox for your python code.

1. Create a new virtualenv
2. Clone or download the files into a folder
3. Run `python get_data·py`
4. Make a cup of tea
5. Review the files which will now exist in a folder called `data`


Pull requests welcome! Also if you think you can build a model that will solve the problem raised above, get in touch.
