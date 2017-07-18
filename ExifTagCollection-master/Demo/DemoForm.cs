using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using LevDan.Exif;
using System.IO;

namespace Demo
{
    public partial class DemoForm : Form
    {
        public DemoForm()
        {
            InitializeComponent();
        }

        private ExifTagCollection _exif;

        private void btnOpen_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Filter = "JPEG Files (*.jpg)|*.jpg|All Files (*.*)|*.*";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                pictureBox.Image = Image.FromFile(ofd.FileName);

                listExif.Items.Clear();
                
                _exif = new ExifTagCollection(ofd.FileName);

                foreach (ExifTag tag in _exif)
                    AddTagToList(tag);
            }
        }

        private void AddTagToList(ExifTag tag)
        {
            ListViewItem item = listExif.Items.Add(tag.Id.ToString());
            item.SubItems.Add(tag.FieldName);
            item.SubItems.Add(tag.Description);
            item.SubItems.Add(tag.Value);
        }

        private void btnLookup_Click(object sender, EventArgs e)
        {
            if (_exif == null)
            {
                MessageBox.Show("Image not loaded");
                return;
            }

            if (string.IsNullOrEmpty(textID.Text))
            {
                MessageBox.Show("Specify ID");
                return;
            }

            try
            {
                int id = Convert.ToInt32(textID.Text);

                listExif.Items.Clear();

                ExifTag tag = _exif[id];

                AddTagToList(tag);
            }
            catch (KeyNotFoundException) { }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private void button1_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Filter = "JPEG Files (*.jpg)|*.jpg|All Files (*.*)|*.*";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                ExifTagCollection exif = new ExifTagCollection(ofd.FileName);

                ExifTag tag = exif[2];
                Console.Out.WriteLine(tag);
                //Latitude (GPSLatitude) = 22° 47' 35,35"
            }
        }
        
    }
}
